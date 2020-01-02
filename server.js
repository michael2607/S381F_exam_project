var express = require('express');
var session = require('cookie-session');
var bodyParser = require('body-parser');
var url = require('url');
var app = express();
app.set('view engine', 'ejs' , 'exif');
var fs = require('fs');
var MongoClient = require('mongodb').MongoClient;
var assert = require ('assert');
var ObjectID = require('mongodb').ObjectID;
var formidable = require("formidable");
var urlencodedParser = bodyParser.urlencoded({extended:false});
var mongourl = 'mongodb://michaelfung:34933996@cluster0-shard-00-00-l8x8q.mongodb.net:27017,cluster0-shard-00-01-l8x8q.mongodb.net:27017,cluster0-shard-00-02-l8x8q.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority';



var SECRETKEY1 = 'key 1';
var SECRETKEY2 = 'key 2';

app.set('view engine','ejs');

app.use(session({
  name: 'session',
  keys: [SECRETKEY1,SECRETKEY2]
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));



app.get('/new', function(req, res){
	res.status(200);
	res.render('new',{});
});




app.post('/showPhotoDetail', function(req, res){
	var form = new formidable.IncomingForm();
	form.parse(req, function (err, fields, files){

		  var photoname = files.photoupload.path;

		  if (files.photoupload.type) {
			  var mimetype = files.photoupload.type;			  
		  }
			
		  console.log(mimetype);		  

		  if(files.photoupload.size > 0 ){
			  var showphoto = true;			  
		  }else{
			  var showphoto = false;			  
		  }

			var title = fields.title;

			var description = fields.description;
		  

		
		  console.log("Insert name = " + title);		  

		fs.readFile(photoname, function(err,data) {
			MongoClient.connect(mongourl, function(err,db) {
			try {
			  assert.equal(err,null);
			  console.log('MongoDB connection successful.')
			} catch (err) {
			  res.set({"Content-Type":"text/plain"});
			  res.status(500).end("MongoClient connect() failed!");
			}

			//------------------------------
			//	try exif
			//------------------------------
			
			var ExifImage = require('exif').ExifImage;
 
			try {
			    new ExifImage({ image : photoname }, function (error, exifData) {
				if (error)
				    console.log('Error: '+error.message);
				else{

				make = exifData.image.Make;
				model = exifData.image.Model;
				createon = exifData.image.ModifyDate;
				
				var new_photo = {};
			
				new_photo['title'] = title;
				new_photo['description'] = description;
				new_photo['make'] = make;
				new_photo['model'] = model;
				new_photo['createon'] = createon;

						


				if (files.photoupload.size > 0 ){
					new_photo['mimetype'] = mimetype;
					new_photo['photo'] = new Buffer(data).toString('base64');
				}else{
					console.log("not jpg");
				}

				insertPhoto(db,new_photo, function(result){
				  db.close();			  
		

				  res.render('showPhotoDetail',{
					  title:title, 
					  description:description, 
					  make:make,
					  model:model,
					  createon:createon,			   
					  photo:new_photo['photo'], 
					  mimetype:mimetype, 
					  showphoto:showphoto, 
			  	  	});
				});
			}
		});

	
			} catch (error) {
			    console.log('Error: ' + error.message);
			}


			
	
		 });
	  });
   });
});

app.use(express.static(__dirname +  '/public'));






function insertPhoto(db,r,callback) {
  db.collection('newPhoto').insertOne(r,function(err,result) {
    assert.equal(err,null);
    console.log("Insert successful!");
    callback(result);
  });
}


app.get('*', function(req,res) {
  res.status(404).end('File not found');
});

app.listen(process.env.PORT || 8099);
