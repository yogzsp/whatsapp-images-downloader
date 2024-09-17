const {makeWASocket, DisconnectReason, useMultiFileAuthState, downloadMediaMessage  } = require('@whiskeysockets/baileys');
const { writeFile } = require('fs/promises');


function getFormattedDate() {
    const date = new Date();
    
    // Mendapatkan tahun, bulan, tanggal, jam, menit
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Bulan dimulai dari 0, jadi tambahkan 1
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');

    // Menggabungkan tanggal dan waktu dalam format yang diinginkan
    return `${year}-${month}-${day}-${hour}-${minute}`;
}


async function connectToWhatsApp () {
    const { state, saveCreds } = await useMultiFileAuthState('bot-session')
    const sock = makeWASocket({
        // can provide additional config here
        printQRInTerminal: true,
        auth: state,
    })

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect)
            // reconnect if not logged out
            if(shouldReconnect) {
                connectToWhatsApp()
            }
        } else if(connection === 'open') {
            console.log('opened connection')
        }
    })
    sock.ev.on ('creds.update', saveCreds)
    
    sock.ev.on('messages.upsert', async(m) => {
        // console.log("sadkl")
        try{
            const n = m.messages[0]
            console.log("ini n",n.message)
            if (!n.message) return // if there is no text or media message
            
            // if the message is an image
            if (n.message.viewOnceMessageV2) {
                // download the message
                const messageType = Object.keys (n.message.viewOnceMessageV2.message)[0]// get what type of message it is -- text, image, video
            	console.log(messageType)
                console.log("Ada data masuk!")
                const buffer = await downloadMediaMessage(
                    n,
                    'buffer',
                    { },
                    { 
                        // pass this so that baileys can request a reupload of media
                        // that has been deleted
                        reuploadRequest: sock.updateMediaMessage
                    }
                )
                // save to file
                switch(messageType){
                	case "imageMessage":
                		await writeFile("./image/"+getFormattedDate()+n.key.remoteJid.replace("@","-")+"-yogzsp bot.jpeg", buffer)
                		break;
                	case "videoMessage":
                		await writeFile("./video/"+getFormattedDate()+n.key.remoteJid.replace("@","-")+n.key.id+"yogzsp bot.mp4", buffer)
                		break;
                }
          }
        }catch(error){
            console.log("error",error)
        }
    //console.clear();
    })
}
// run in main file
connectToWhatsApp()
