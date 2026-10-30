const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Ek folder banayenge jisme saari QR images save hongi
const outputDir = path.join(__dirname, 'qr_codes_output');
if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir);
}

// Aapke products ya serial numbers ki list (Aap ise apne hisab se badha sakte hain)
const products = [
    { model: "NanoMixer", serialNo: "NM1001" },
    { model: "NanoMixer", serialNo: "NM1002" },
    { model: "NanoCooker", serialNo: "NC2001" },
    { model: "NanoGrinder", serialNo: "NG3001" }
];

async function generateQRCodes() {
    for (let item of products) {
        // WhatsApp URL jisme product aur serial number pehle se pre-filled hoga
        // (Yahan apna WhatsApp Business number daal dena 91 ke sath)
        let whatsappNumber = "919876543210"; 
        let message = `Hi, I want to register warranty for ${item.model} with Serial Number ${item.serialNo}`;
        let qrUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

        let fileName = `${item.model}_${item.serialNo}.png`;
        let filePath = path.join(outputDir, fileName);

        try {
            // QR Code image generate karke file save karna
            await QRCode.toFile(filePath, qrUrl, {
                color: {
                    dark: '#000000',  // QR code dots color
                    light: '#FFFFFF'  // Background color
                },
                width: 300
            });
            console.log(`Generated: ${fileName}`);
        } catch (err) {
            console.error(`Error generating QR for ${item.serialNo}:`, err);
        }
    }
    console.log("\n Sabhi QR codes successfully 'qr_codes_output' folder me generate ho gaye hain! 🚀");
}

generateQRCodes();