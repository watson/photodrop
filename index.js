#!/usr/bin/env node
'use strict'

var os = require('os')
var fs = require('fs')
var path = require('path')
var http = require('http')
var uuid = require('node-uuid')
var opn = require('opn')
var airplay = require('airplay-photos')('PhotoDrop')

var baseDir = os.tmpdir()
var photos = []

function frontpage (req, res) {
  var fullPath = path.join(__dirname, 'public', 'index.html')
  fs.createReadStream(fullPath).pipe(res)
}

function photoJson (req, res) {
  res.end(JSON.stringify(photos))
}

function publicFile (req, res) {
  var fullPath = path.join(__dirname, path.resolve('/', req.url))
  fs.createReadStream(fullPath).pipe(res)
}

function picture (req, res) {
  var filename = req.url.substr(1) // remove leading slash
  if (!~photos.indexOf(filename)) {
    res.writeHead(404)
    res.end()
    return
  }
  var fullPath = path.join(baseDir, filename)
  fs.createReadStream(fullPath).pipe(res)
}

var server = http.createServer(function (req, res) {
  console.log(req.method, req.url)
  if (req.url === '/') frontpage(req, res)
  else if (req.url === '/photos') photoJson(req, res)
  else if (req.url.indexOf('/public/') === 0) publicFile(req, res)
  else picture(req, res)
})

server.listen(function () {
  var port = server.address().port
  console.log('photodrop server is listening on port', port)
  opn('http://localhost:' + port)
})

airplay.on('photo', function (req) {
  var filename = uuid.v4() + '.jpg'
  var fullPath = path.join(baseDir, filename)
  var file = fs.createWriteStream(fullPath)

  photos.push(filename)

  console.log('writing new picture:', fullPath)
  req.pipe(file)
})
