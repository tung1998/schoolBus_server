const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const TEMP_FOLDER = 'temp'
// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = './images/token.json';
const WeMap_DRIVE_FOLDER = '1n60dzBY_7WHTm8sPA9Rio7p3oAUzg0Si'
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback, options) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getAccessToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client, options);
    });
}

function authorizePromise(credentials, callback, options) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    const token = fs.readFileSync(TOKEN_PATH)
    oAuth2Client.setCredentials(JSON.parse(token));
    const drive = google.drive({ version: 'v3', auth: oAuth2Client })

    return callback(drive, options);
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(drive) {
    drive.files.list({
        pageSize: 10,
        fields: 'nextPageToken, files(id, name)',
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const files = res.data.files;
        if (files.length) {
            console.log('Files:');
            files.map((file) => {
                console.log(`${file.name} (${file.id})`);
            });
        } else {
            console.log('No files found.');
        }
    });
}

function uploadFileModel(drive, options) {
    return new Promise((resolve, reject) => {
        const media = {
            mimeType: options.type,
            body: fs.createReadStream(`./${TEMP_FOLDER}/${options.imageName}`)
        };
        const fileMetadata = {
            'name': `${options.imageName}.${options.type.replace("image/", "")}`,
            parents: [options.folderID]
        };
        drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id'
        }, (err, file) => {
            fs.unlinkSync(`./${TEMP_FOLDER}/${options.imageName}`)
            if (err) {
                // Handle error
                reject(err)
            } else {
                resolve(file.data.id)
            }
        });
    })
}

function createFolderModel(drive, options) {
    return new Promise((resolve, reject) => {
        var fileMetadata = {
            'name': options.folderName,
            'mimeType': 'application/vnd.google-apps.folder',
            parents: [WeMap_DRIVE_FOLDER]
        };
        drive.files.create({
            resource: fileMetadata,
            fields: 'id'
        }, function (err, file) {
            if (err) {
                // Handle error
                reject(err);
            } else {
                resolve(file.data.id)
            }
        });
    })
}

function publicFileModel(drive, options) {
    return new Promise((resolve, reject) => {
        drive.permissions.create({
            resource: { "role": "reader", "type": "anyone" },
            fileId: options.fileId,
            fields: 'id',
        }, function (err, res) {
            if (err) {
                // Handle error...
                reject(err);
            } else {
                resolve(res.data.id)
            }
        });
    })
}

function uploadFileController(folderID, images) {
    const content = fs.readFileSync('./images/credentials.json')
    const promises = []
    images.forEach(imageName => {
        const options = {
            imageName: imageName.imageName,
            folderID,
            type: imageName.type
        }
        promises.push(authorizePromise(JSON.parse(content), uploadFileModel, options))
    })
    return Promise.all(promises)
}

function createFolderController() {
    const options = {
        folderName: Date.now()
    }
    const content = fs.readFileSync('./images/credentials.json')
    return authorizePromise(JSON.parse(content), createFolderModel, options);
}

function publicFileController(fileIds) {
    const content = fs.readFileSync('./images/credentials.json')
    const promises = []
    fileIds.forEach(fileId => {
        const options = {
            fileId
        }
        return authorizePromise(JSON.parse(content), publicFileModel, options);
    })
    return Promise.all(promises)

}

function initialToken() {
    fs.readFile('credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Drive API.
        authorize(JSON.parse(content), listFiles);
    });
}

module.exports = {
    initialToken,
    createFolderController,
    uploadFileController,
    publicFileController
}