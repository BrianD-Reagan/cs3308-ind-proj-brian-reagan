var express = require('express');
var app = express();
var bodyParser = require('body-parser'); 
app.use(bodyParser.json());              
app.use(bodyParser.urlencoded({ extended: true }));
const axios = require('axios');

var pgp = require('pg-promise')();


const dev_dbConfig = {
    host: 'db',
    port: 5432,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
};

const isProduction = process.env.NODE_ENV === 'production';
const dbConfig = isProduction ? process.env.DATABASE_URL : dev_dbConfig;

const dbConfig = process.env.DATABASE_URL;
pgp.pg.defaults.ssl = {rejectUnauthorized: false};

const db = pgp(dbConfig);


app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/'));

//
// Default get request - loads main.ejs
//
app.get('/', function(req,res) {
    res.render('pages/main', {
        my_title: 'Main',
        tv: '',
        error: false
    })
});


//
// - loads reviews.ejs
//
app.get('/reviews', function(req,res){
    var query = "SELECT * FROM reviews;";

    db.any(query)
    .then(info => {
        res.render('pages/reviews', {
            my_title: 'Reviews',
            reviews: info,
            error: false
        })
    })
    .catch(err => {
        console.log("Error:\n",err);
        res.render('pages/reviews', {
            my_title: 'Reviews',
            reviews: '',
            error: true
        })
    })
})

/**
 * API Documentation
 * Name: tv.show.name
 * Image: tv.show.image.medium
 * Genres: tv.show.genres
 * Summary: tv.show.summary
 * Avg ratings: tv.show.rating.average
 */

//
// TV Maze API call
//
app.get('/tvsearch', function(req,res){
    var tv_title = req.query.tvsearch;

    if(tv_title){
        axios({
            url: `http://api.tvmaze.com/search/shows?q=${tv_title}`,
            method: 'GET',
            dataType: 'json'
        })
            .then(items => {
                console.log("Search successful: ", items.data[0].show.name);
                res.render('pages/main', {
                    my_title: 'Main',
                    tv: items.data[0],
                    error: false
                })
            })
            .catch(err => {
                console.log("TV Maze API call unsuccessful", err);
                res.render('pages/main', {
                    my_title: 'Main',
                    tv: '',
                    error: true
                })
            });
    }
    else {
        console.log("Not good title");
        res.render('pages/main', {
            my_title: 'Main',
            tv: '',
            error: true
        })
    }

});

// Get today's date as 'YYYYMMDD'
function get_date() {
    var today = new Date();
    var month = (today.getMonth()+1);
        if(month < 10){
            month = '0' + month.toString();
        } else {
            month = month.toString();
        }
    var d = today.getFullYear().toString() + month + today.getDate().toString();
    today = null;
    return d;
}

// Replace apostrophe with backtick to prevent breaking quote
function fixString(old_string){
    var new_string = old_string.replace("'","`");
    return new_string
}

//
// Add review
//
app.post('/reviews/addReview', function(req,res) {
    var title = req.body.title;
    var review = req.body.review;
    var date = get_date();
    review = fixString(review);
    var insert = "INSERT INTO reviews(title, review, review_date) VALUES('"+title+"','"+review+" ', '"+date+"');";
    var query = "SELECT * FROM reviews;";

    db.task('get-everything', task => {
        return task.batch([
            task.any(insert),
            task.any(query)
        ]);
    })
    .then(info => {
        console.log("Review added successfully");
        res.render('pages/reviews', {
            my_title: 'Reviews',
            reviews: info[1],
            error: false
        });
    })
    .catch(err => {
        res.render('pages/reviews',{
            my_title: 'Reviews',
            reviews: '',
            error: true
        });
    })
});

//
// Filter reviews
//
app.get('/reviews/filter', function(req,res){
    var title = req.query.filter_name;
    filter_name = fixString(filter_name);
    var query = "SELECT * FROM reviews WHERE title = '"+title+"';";
    var default_query = "SELECT * FROM reviews";
    db.any(query)
    .then(info => {

        if(info.length === 0){
            db.any(default_query)
            .then(rows => {
                res.render('pages/reviews', {
                    my_title: 'Reviews',
                    reviews: rows,
                    error: false
                })
            })
        } else {
            res.render('pages/reviews', {
                my_title: 'Reviews',
                reviews: info,
                error: false
            })
        }
    })
    .catch(err => {
        console.log("Error:\n", err);
        res.render('pages/reviews', {
            my_title: 'Reviews',
            reviews: '',
            error: true
        })
    })

});

//app.listen(3000);
const server = app.listen(process.env.PORT || 3000, () => {
    console.log(`Express running → PORT ${server.address().port}`);
});