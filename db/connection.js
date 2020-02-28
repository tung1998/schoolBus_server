const { MongoClient } = require('mongodb')

/**
 * Connect db.
 * @param {string} host
 * @param {number} port
 * @param {string} username
 * @param {string} password
 * @param {string} name
 * @returns {Object}
 */
function initDatabase (host, port, username, password, name) {
  return MongoClient.connect(`mongodb://${host}:${port}/${name}`)
}

module.exports = initDatabase
