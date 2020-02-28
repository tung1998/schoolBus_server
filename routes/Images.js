const express = require('express')
const router = express.Router()

const { createFolderController, uploadFileController, publicFileController } = require(`../images/drive.js`)
const { base64ToImage, getLinkFile } = require(`../images/common.js`)

let GG_FOLDER = {}

router.post('/', (req, res) => {
    let { db } = req.app.locals
    if (req.body.imageId && req.body.BASE64 && Array.isArray(req.body.BASE64)) {
        const imageId = req.body.imageId
        db.collection(`images`).findOne({ imageId }).then(doc => {
            const images = base64ToImage(req.body.BASE64)
            if (!GG_FOLDER.id || GG_FOLDER.time < Date.now() - 24 * 60 * 60 * 1000) {
                createFolderController().then(id => {
                    GG_FOLDER.id = id
                    GG_FOLDER.time = Date.now()
                    return uploadFileController(id, images)
                }).then(fileIds => {
                    if (!doc) {
                        db.collection(`images`).insert({ imageId, IMG_IDS: fileIds })
                    } else {
                        db.collection(`images`).update({ imageId }, { $push: { IMG_IDS: { $each: fileIds } } })
                    }
                    res.send({ error: false })
                    return publicFileController(fileIds)
                }).catch(error => {
                    console.log(error)
                    res.send({ error: true, message: "Unexpected error!" })
                })
            } else {
                uploadFileController(GG_FOLDER.id, images).then(fileIds => {
                    if (!doc) {
                        db.collection(`images`).insert({ imageId, IMG_IDS: fileIds })
                    } else {
                        db.collection(`images`).update({ imageId }, { $push: { IMG_IDS: { $each: fileIds } } })
                    }
                    res.send({ error: false })
                    return publicFileController(fileIds)
                }).catch(error => {
                    console.log(error)
                    res.send({ error: true, message: "Unexpected error!" })
                })
            }
        })
    } else {
        res.send({ error: true })
    }
})

router.get('/:imageId', (req, res) => {
    let { db } = req.app.locals
    if (req.params.imageId) {
        const imageId = req.params.imageId
        db.collection(`images`).findOne({ imageId }).then(data => {
            if (!data)
                res.send({ error: false, result: data })
            else {
                const IMGS = []
                data.IMG_IDS.forEach(id => {
                    IMGS.push(getLinkFile(id))
                })
                Promise.all(IMGS).then(IMG_IDS => {
                    data.IMG_IDS = IMG_IDS
                    delete data._id
                    res.send({ error: false, result: data })
                }).catch(console.log)
            }
        })
    } else {
        res.send({ error: true })
    }
})

router.get('/:imageId/:imageIndex', (req, res) => {
    let { db } = req.app.locals
    if (req.params.imageId && parseInt(req.params.imageIndex) >= 0) {
        const imageId = req.params.imageId
        const imageIndex = parseInt(req.params.imageIndex)
        db.collection(`images`).findOne({ imageId }).then(data => {
            if (!data || !data.IMG_IDS[imageIndex])
                res.send({ error: true })
            else {
                getLinkFile(data.IMG_IDS[imageIndex]).then(IMG_Link => {
                    res.redirect(IMG_Link);
                }).catch(console.log)
            }
        })
    } else {
        res.send({ error: true })
    }
})

router.get('/', (req, res) => {
    let { db } = req.app.locals
    db.collection(`images`).find({}).toArray().then(data => {
        const result = data.map(d => d.imageId)
        res.send({ error: false, result })
    })
})

module.exports = router