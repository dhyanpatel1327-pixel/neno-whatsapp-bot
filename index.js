const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Product = require('./models/Product');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect('mongodb+srv://dhyanpatel1327_db_user:Dhyan1569@cluster0.mv1kizl.mongodb.net/')
.then(() => {
    console.log("Connected to MongoDB successfully! 🍃");
}).catch(err => {
    console.error("MongoDB connection error:", err);
});

// Meta WhatsApp Credentials
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN; 
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID; 

// Temporary In-Memory Session State for Multi-Step Chat
const userSessions = new Map();

// Webhook GET (Verification)
app.get('/webhook', (req, res) => {
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    if (mode && token === "my_warranty_token_123") {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// Webhook POST (Incoming Messages)
app.post('/webhook', async (req, res) => {
    let body = req.body;

    if (body.object) {
        try {
            let entry = body.entry[0];
            let changes = entry.changes[0];
            let value = changes.value;

            if (value.messages && value.messages[0]) {
                let message = value.messages[0];
                let senderPhone = message.from; 
                let messageText = message.text ? message.text.body.trim() : "";

                console.log(`Received from ${senderPhone}: ${messageText}`);

                let session = userSessions.get(senderPhone) || { step: 'IDLE' };

                // 1st Step: Customer sends product details / QR scan message -> Bot asks Name
                if (session.step === 'IDLE' || messageText.includes("NKMG001W75") || messageText.toLowerCase().includes("steelpro") || messageText.toLowerCase().includes("hello")) {
                    
                    userSessions.set(senderPhone, { step: 'WAITING_FOR_NAME' });

                    let msg2 = "Hello, Queen! 👑❤️ Welcome to the Neno Family!\n\n" +
                               "Congratulations on bringing home your new Neno product ! ✨ " +
                               "May your kitchen be a place of creativity, confidence and joy.\n\n" +
                               "What name would you like us to call you after maharani? 💖";

                    await sendWhatsAppMessage(senderPhone, msg2);

                } 
                // 2nd Step: Customer sends name -> Bot asks Store & PIN
                else if (session.step === 'WAITING_FOR_NAME') {
                    let customerName = messageText; 
                    
                    userSessions.set(senderPhone, { 
                        step: 'WAITING_FOR_STORE_AND_PIN', 
                        customerName: customerName 
                    });

                    let msg4 = `Dear Maharani ${customerName} 👑❤️,\n\n` +
                               `To complete your Neno warranty registration, may we know the name of the store you purchased your Neno appliance from and your 6-digit PIN code?\n\n` +
                               `Thank you for being a part of the Neno Family! ✨`;

                    await sendWhatsAppMessage(senderPhone, msg4);
                }
                // 3rd Step: Customer sends Store & PIN -> Bot asks for Product Serial Number
                else if (session.step === 'WAITING_FOR_STORE_AND_PIN') {
                    let customerName = session.customerName || "Maharani";
                    let storeInfo = messageText;

                    userSessions.set(senderPhone, { 
                        step: 'WAITING_FOR_SERIAL_NUMBER', 
                        customerName: customerName,
                        storeInfo: storeInfo
                    });

                    let msgSerial = `May we have your Neno product's *serial number* to complete your warranty registration? You'll usually find it on the product's label.\n\n` +
                                    `Thank you for choosing Neno, Maharani! ✨`;

                    await sendWhatsAppMessage(senderPhone, msgSerial);
                }
                // 4th Step: Customer sends Serial Number -> Save to DB & Send Final Success Message
                else if (session.step === 'WAITING_FOR_SERIAL_NUMBER') {
                    let customerName = session.customerName || "Maharani";
                    let storeInfo = session.storeInfo || "";
                    let serialNumber = messageText; // Customer dwara bheja gaya actual serial number

                    let expiryDate = new Date();
                    expiryDate.setMonth(expiryDate.getMonth() + 60); // 60 Months Motor Warranty

                    try {
                        let newProductRecord = new Product({
                            modelName: "Neno Steelpro Mixer Grinder",
                            serialNo: serialNumber, // Yahi customer ka serial number database me jayega
                            customerPhone: senderPhone,
                            customerName: customerName,
                            storeInfo: storeInfo,
                            isRegistered: true,
                            warrantyExpiryDate: expiryDate
                        });
                        await newProductRecord.save();
                    } catch (dbError) {
                        console.log("Database save note: ", dbError.message);
                    }

                    userSessions.set(senderPhone, { step: 'COMPLETED' });

                    // Final Success Message with customer's own serial number as warranty code
                    let msgFinal = `Congratulations, Maharani ${customerName}! 👑❤️\n\n` +
                                   `Your Neno warranty has been *successfully approved!*\n` +
                                   `Welcome officially to the Neno Queen Family, where every kitchen became kingdom and queen feels freedom!! 👸\n\n` +
                                   `Your warranty code - ${serialNumber}\n\n` +
                                   `Enjoy your meal at your kingdom with creativity joy and freedom. ✨\n\n` +
                                   `Thank you for choosing Neno. We're proud to be a part of your kitchen journey! ❤️\n\n` +
                                   `*Neno — Unleash Your Inner Chef.*`;

                    await sendWhatsAppMessage(senderPhone, msgFinal);
                }
                else {
                    userSessions.set(senderPhone, { step: 'IDLE' });
                    let defaultMsg = "Namaste! Neno Kitchenware me aapka swagat hai. Kripya apna product ka message bhejen taaki warranty registration shuru ho sake.";
                    await sendWhatsAppMessage(senderPhone, defaultMsg);
                }
            }
            res.sendStatus(200);
        } catch (error) {
            console.error("Webhook Error:", error.response?.data || error.message);
            res.sendStatus(500);
        }
    } else {
        res.sendStatus(404);
    }
});

// Helper function to send WhatsApp messages
async function sendWhatsAppMessage(recipientPhone, textMessage) {
    try {
        await axios.post(
            `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to: recipientPhone,
                text: { body: textMessage }
            },
            {
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error) {
        console.error("Failed to send WhatsApp message:", error.response?.data || error.message);
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} 🚀`);
});