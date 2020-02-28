const fs = require('fs')
const request = require(`request`)
const TEMP_FOLDER = 'temp'
function base64Encode(file) {
    const bitmap = fs.readFileSync(file);
    return Buffer.from(bitmap).toString('base64');
}

function base64ToImage(BASE64) {
    const result = []
    BASE64.forEach(b64 => {
        const randomName = makeID()
        const type = cutStr(b64, "data:", ";base64")
        fs.writeFileSync(`./${TEMP_FOLDER}/${randomName}`, b64.replace(`data:${type};base64,`, ''), 'base64')
        result.push({imageName: randomName, type})
    })
    return result
}

function makeID(length = 10) {
    let result = ''
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const charactersLength = characters.length
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
}

function getLinkFile(fileID) {
    return new Promise((resolve, reject) => {
        request({
            url: `https://drive.google.com/uc?export=download&id=${fileID}`,
            followRedirect: false
        }, (error, header, body) => {
            if (error || header.statusCode != 302)
                reject(error)
            else
                resolve(header.headers.location)
        })
    })
}

function cutStr(str, start, end){
    const startPos = str.indexOf(start);
    if(startPos >= 0){
        let temp = str.slice(startPos + start.length);
        return temp.slice(0, temp.indexOf(end));
    } else 
        return '';
}

module.exports = {
    base64Encode,
    base64ToImage,
    makeID,
    getLinkFile
}