const mongoose = require('mongoose');
const faker = require('faker');
const chai = require('chai');
const chaiHttp = require('chai-http');

const {BlogPost} = require('../models');
const {closeServer, runServer, app} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

const should = chai.should();

chai.use(chaiHttp);

function tearDownDb() {
  return new Promise((resolve, reject) => {
    console.warn('Deleting database');
    mongoose.connection.dropDatabase()
    .then(result => resolve(result))
    .catch(err => reject(err));
  })
}

function seedBlogPostData() {
  console.info('seeding blog post data');
  const seedData = [];
  for (let i = 1; i < 10; i++) {
    seedData.push({
      author: {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName()
      },
      title: faker.lorem.sentence(),
      content: faker.lorem.text()
    });
  }
  return BlogPost.insertMany(seedData);
}

describe('blog posts API', function() {
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function(){
    return seedBlogPostData();
  });

  afterEach(function(){
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  });

  describe('GET endpoint', function(){
    let res;
    return chai.request(app)
    .get('/posts')
    .then(_res => {
      res = _res;
      res.should.have.status(200);
      res.body.should.have.length.of.at.least(1);

      return BlogPost.count();
    })
    .then(count => {
      res.body.should.have.length.of(count);
    });
  });

  it('should return posts with right fields', function(){
    let resPost;
    return chai.request(app)
    .get('/posts')
    .then(function(res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('array');
      res.body.should.have.length.of.at.least(1);

      res.body.forEach(function(post){
        post.should.be.a('object');
        post.should.include.keys('id', 'author', 'title', 'content', 'created');
      });
      resPost = res.body[0];
      return BlogPost.findById(resPost.id);
    })
    .then(post => {
      resPost.title.should.equal(post.title);
      resPost.content.should.equal(post.content);
      resPost.author.should.equal(post.authorName)
    };
  });
});
