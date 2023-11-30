import fs from 'fs';
import admin from 'firebase-admin';
import express from "express";
import { db, connectToDb } from "./db.js";


// let articleInfo = [{
//     name: 'learn-react',
//     upvotes: 0,
//     comments: [],
// },
// {
//     name: 'learn-node',
//     upvotes: 0,
//     comments: [],
// },
// {
//     name: 'mongodb',
//     upvotes: 0,
//     comments: [],
// }]
const credentials = JSON.parse(
  fs.readFileSync('../credentials.json')
);
admin.initializeApp({
  credential: admin.credential.cert(credentials),
});

const app = express();
app.use(express.json()); // middleware to enable posting json

app.get('/api/articles/:name', async (req, res) => {
  const { name } = req.params;
  // const client = new MongoClient('mongodb://127.0.0.1:27017');
  // const client = new MongoClient('mongodb://localhost:27017');
  // const client = new MongoClient('mongodb://172.26.169.37:27017'); 
  // mongodb://localhost:27017/?readPreference=primary&ssl=false&directConnection=true


  const article = await db.collection('articles').findOne({ name });
  if (article) {
    res.json(article);
} else {
    res.sendStatus(404);
}

});

// app.post('/hello', (req, res) => {
//     console.log(req.body);
//     res.send(`Howdy! ${req.body.name}`);
// });

// app.get('/hello/:name', (req, res) => {
//     const {name} = req.params;
//     res.send (`Hello ${name}`)
// })

app.put("/api/articles/:name/upvote", async (req, res) => {
  const { name } = req.params;
  // const article = articleInfo.find((a) => a.name === name);

  await db.collection('articles').updateOne({name}, {
    $inc: {upvotes:1},
  });
  const article = await db.collection('articles').findOne({name});

  if (article) {
    article.upvotes += 1;
    res.send(`The ${name} article now has ${article.upvotes} upvotes`);
  } else {
    res.send("That article doesn't exist");
  }
});

app.post("/api/articles/:name/comments", async (req, res) => {
  const { name } = req.params;
  const { postedBy, text } = req.body;
  // const article = articleInfo.find((a) => a.name === name);

  await db.collection('articles').updateOne({name}, {
    $push: {comments: {postedBy, text}},
  });
  const article = await db.collection('articles').findOne({name});

  if (article) {
    article.comments.push({ postedBy, text });
    res.send(article.comments);
  } else {
    res.send("That article doesn't exist");
  }
});


connectToDb(() => {
  console.log('Successfully connected to database!');
  app.listen(8000, () => {
      console.log('Server is listening on port 8000');
  });
});
