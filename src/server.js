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
  fs.readFileSync('./credentials.json')
);
admin.initializeApp({
  credential: admin.credential.cert(credentials),
});

const app = express();
app.use(express.json()); // middleware to enable posting json

app.use(async (req, res, next) => {
const {authtoken} = req.headers;

if (authtoken) {
  try {
    req.user = await admin.auth().verifyIdToken(authtoken);
  } catch (e) {
   return res.sendStatus(400);
  }
}
req.user = req.user || {};

next();
});

app.get('/api/articles/:name', async (req, res) => {
  const { name } = req.params;
  // const client = new MongoClient('mongodb://127.0.0.1:27017');
  // const client = new MongoClient('mongodb://localhost:27017');
  // const client = new MongoClient('mongodb://172.26.169.37:27017'); 
  // mongodb://localhost:27017/?readPreference=primary&ssl=false&directConnection=true

const {uid} = req.user;
  const article = await db.collection('articles').findOne({ name });
  if (article) {
   const upvoteIds = article.upvoteIds || []; 
   article.canUpvote = uid && !upvoteIds.includes(uid);
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

app.use((req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.sendStatus(401);
  }
})

app.put("/api/articles/:name/upvote", async (req, res) => {
  const { name } = req.params;
  const {uid} = req.user;
  // const article = articleInfo.find((a) => a.name === name);

  const article = await db.collection('articles').findOne({ name });
  if (article) {
   const upvoteIds = article.upvoteIds || []; 
   const canUpvote = uid && !upvoteIds.includes(uid);

   if (canUpvote) {
    await db.collection('articles').updateOne({name}, {
      $inc: {upvotes:1},
      $push: {upvoteIds: uid}
    });
   }

  const updatedArticle = await db.collection('articles').findOne({name});
res.json(updatedArticle)
    // article.upvotes += 1;
    res.json(article);
  } else {
    res.send("That article doesn't exist");
  }
});

app.post("/api/articles/:name/comments", async (req, res) => {
  const { name } = req.params;
  const { text } = req.body;
  const {email} = req.user;
  // const article = articleInfo.find((a) => a.name === name);

  await db.collection('articles').updateOne({name}, {
    $push: {comments: {postedBy:email, text}},
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
