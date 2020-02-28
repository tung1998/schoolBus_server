const { google } = require("googleapis");
const fs = require(`fs`)
const credentials = require(`./credentials.json`)
const token = require(`./token.json`)

function refreshToken() {
    const OAuth2 = google.auth.OAuth2;

    const oauth2Client = new OAuth2(
        credentials.installed.client_id, // ClientID
        credentials.installed.client_secret, // Client Secret
        "http://localhost" // Redirect URL
    );

    oauth2Client.setCredentials({
        refresh_token:
            token.refresh_token
    });
    oauth2Client.getAccessToken().then(result => {
        fs.writeFileSync('token.json', JSON.stringify(result.res.data))
        console.log(result.res.data.expiry_date)
    }).catch(console.log)
}

module.exports = {
    refreshToken
}