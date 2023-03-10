var formidable = require('formidable');
var http = require('http');
var fs = require('fs');
var process = require('process');
var detect = require('detect-file-type');
var mime_types = require('mime-types')
var Minio = require('minio');
var slugify = require('transliteration').slugify;
var NodeClam = require('clamscan');
var formOpt = {uploadDir: `${__dirname}/uploads`, maxFileSize: 100 * 1024 * 1024, hashAlgorithm: 'sha1'};

process.env.MINIO_ENDPOINT
process.env.MINIO_PORT
process.env.MINIO_USE_SSL
process.env.MINIO_ACCESS_KEY
process.env.MINIO_SECRET_KEY
process.env.MINIO_BUCKET
process.env.BASE_URLS

var ClamScan = new NodeClam().init();
var avscan = null;

var hosts = process.env.BASE_URLS.split(",").filter(x => x != "");

var fs = require('fs');
var crypto = require('crypto');

const noop = () => {};

var minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: parseInt(process.env.MINIO_PORT, 10),
    useSSL: process.env.MINIO_USE_SSL.toLowerCase() == "true",
    partSize: 16777216,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY
});

var bucket = process.env.MINIO_BUCKET;

process.title = `${process.title} - MinIO Upload`;

if (!fs.existsSync(formOpt.uploadDir)){
    fs.mkdirSync(formOpt.uploadDir);
}

ClamScan.then(async clamscan => {
    const version = await clamscan.getVersion();
    console.log(`ClamAV Version: ${version}`);
    avscan = clamscan;
    http.createServer(server).listen(3000);
}).catch(err => {
    console.log(`ClamAV Error`);
    console.log(err);
});

async function save_to_s3(fpath, fn, obj, cb){
    let uuid = crypto.randomUUID();
    let currentTime = new Date();
    let path = `/${currentTime.getFullYear()}/${currentTime.getMonth() + 1}/${currentTime.getDate()}/${uuid}`;

    obj.time = Date.now();
    
    const {isInfected, file, viruses} = await avscan.isInfected(fpath);
    //save virus incidence
    if(isInfected){
        console.log(`${file} is infected with ${viruses}!`);
        obj.infected = viruses
        minioClient.putObject(bucket, `${path}/${crypto.randomUUID()}.json`, JSON.stringify(obj, null, 2), {'Content-Disposition': 'inline','Content-Type': 'application/json'}, noop);
        cb("");
        return;
    }
    console.log(`${file} is safe.`);
    detect.fromFile(fpath, function(err, mimetype){
        if(err){
            cb("");
            return;
        }
        let metaData = {
            'Content-Disposition': `inline; filename="${encodeURIComponent(fn)}"`,
            'Content-Type': mimetype?.mime || mime_types.lookup(fn) || 'application/octet-stream',
            'SHA1': obj?.file?.hash || null
        }
        minioClient.fPutObject(bucket, `${path}/${slugify(fn)}`, fpath, metaData, function(e) {
            if(e){
                cb("");
                return;
            }
            minioClient.setObjectTagging(bucket, `${path}/${slugify(fn)}`, {'expire-in':'7d'});
            cb(`${path}/${slugify(fn)}`);
        });
    });
}

function server(req, res) {
    console.log(req.url);
    if(req.method == 'POST' && req.url.startsWith("/fileupload")){
        const fm = formidable(formOpt);
        fm.parse(req, (err, fields, files) => {
            if(err){
                console.log(err);
                res.writeHead(err.httpCode || 400, { 'Content-Type': 'text/plain' });
                res.end("Something wrong");
                return;
            }
            if(!files.filetoupload){
                console.log("no file field")
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end("Something wrong");
                return;
            }
            save_to_s3(files.filetoupload.filepath, files.filetoupload.originalFilename, {headers: req.headers, file: files.filetoupload}, (path) => {
                fs.unlink(files.filetoupload.filepath, (err, file) => {});
                if(!path){
                    console.log("s3 upload failed")
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end("Something wrong");
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8'});
                let result = 'https://' + hosts[Math.floor(Math.random() * hosts.length)] + path;
                res.end(JSON.stringify({url: result}));
                //request(result, function(error, response, body){console.log(data.path + " verified")});
            });
        });
    }else{
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(fs.readFileSync('index.html').toString());
    res.end();
  }
}
