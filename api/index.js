import bodyParser from "body-parser";
import express from "express";
import { MongoClient } from "mongodb";

const DATABASE_NAME = "cs193x_assign3";

const api = new express.Router();

let postColl;
let userColl;

const initApi = async (app) => {
  app.set("json spaces", 2);
  app.use("/api", api);

  const conn = await MongoClient.connect(`mongodb://localhost`);
  const db = conn.db(DATABASE_NAME);
  postColl = db.collection(`posts`);
  userColl = db.collection(`users`);
};

api.use(bodyParser.json());

api.get("/", (req, res) => {
  res.json({ db: "local_api", numUsers: 1, numPosts: 1 });
});

api.get("/tests/get", (req, res) => {
  let value = req.query.value || null;
  res.json({ success: true, value });
});

api.post("/tests/post", (req, res) => {
  let value = req.body.value || null;
  res.json({ success: true, value });
});

api.get("/tests/error", (req, res) => {
  res.status(499).json({ error: "Test error" });
});

api.all("/tests/echo", (req, res) => {
  res.json({
    method: req.method,
    query: req.query,
    body: req.body,
  });
});

//get users
api.get(`/users`, async (req, res) => {
  let allUsers = await userColl.find().toArray();
  let users = allUsers.map((user) => user.id);

  res.json({users} );
});

api.use("/users/:id", async (req, res, next) => {
  let id = req.params.id;
  //projection để loại bỏ _id ra khỏi kết quả
  let user = await userColl.findOne({ id: id }, { projection: { _id: 0 } });
  if (!user) {
    res.status(404).json({ error: `User ${id} does not exist` });
  } else {
    //luu user vao local
    res.locals.user = user;
    next();
  }
});
//get users/:id
api.get("/users/:id", async (req, res) => {
  let user = res.locals.user;
  res.status(200).json(user);
});

api.post(`/users`, async (req, res) => {
  let id = req.body.id;
  if (!req.body || !id) {
    return res
      .status(400)
      .json({ error: "Request body must contain an 'id' property" });
  }
  if (!id) {
    return res.status(400).json({ error: "User ID cannot be empty" });
  }
  const userExists = (await userColl.findOne({ id: id })) !== null;
  if (userExists) {
    return res.status(400).json({ error: "User already exists" });
  }

  let newUser = {
    id: id,
    name: id,
    avatarURL: "images/default.png",
    following: [],
  };
  await userColl.insertOne(newUser);
  // userData.user.push(newUser);

  res.status(200).json(newUser);
});

api.patch(`/users/:id`, async (req, res) => {
  let user = res.locals.user;
  let name = req.body.name;
  let avatarURL = req.body.avatarURL;

  if (name === "" || name === undefined) {
    user.name = user.id;
  } else {
    user.name = name;
  }

  if (avatarURL === "" || avatarURL === undefined) {
    user.avatarURL = "images/default.png";
  } else {
    user.avatarURL = avatarURL;
  }

  await userColl.replaceOne({ id: user.id }, user);
  res.status(200).json({ user });
});
api.get(`/users/:id/feed`, async (req, res) => {
  let user = res.locals.user;
  const posts = [];
  // lấy thông tin bài đăng của chính người dùng
  let userPosts = await postColl.find({ userId: user.id }).toArray();
  for (const {  time, text } of userPosts) {
    posts.push({
      user: {
        id: user.id,
        name: user.name,
        avatarURL: user.avatarURL,
      },
      time: time,
      text: text,
    })
  }

  //lay mang following
  const following = user.following;
  //lấy thông tin bài đăng của following
  const followingPost = await postColl.find({ userId: { $in: following } }).toArray();

  for (const { time, text } of followingPost) {
    //lay thong tin user following
    const followingInfor = await userColl.find({ id: { $in: following } }).toArray();
    console.log(followingInfor);
    for(const {  id,name, avatarURL } of followingInfor){
    posts.push({
      user: {
        id: id,
        name: name,
        avatarURL: avatarURL,
      },
      time: time,
      text: text,
    })
  }
  }
  res.status(200).json({ posts });

});


api.post(`/users/:id/posts`, async (req, res) => {
  let user = res.locals.user;
  let text = req.body.text;
  if (!req.body || text === "") {
    return res.status(400).json({ error: "Request body must contain text" });
  }
  let newPost = {
    userId: user.id,
    time: new Date(),
    text: text,
  };
  await postColl.insertOne(newPost);
  res.status(200).json({ newPost });
});

api.post(`/users/:id/follow`, async (req, res) => {
  let user = res.locals.user;
  const targetId = req.query.target;

  if (!targetId || targetId === "") {
    return res.status(400).json({
      error:
        "The query string is missing a target property, or target is empty",
    });
  }

  let targetUser = await userColl.findOne({ id: targetId });
  if (!user || !targetUser) {
    return res.status(404).json({ error: "User id or target does not exist" });
  }
  // Kiểm tra user đã theo dõi target chua
  if (user.following.includes(targetId)) {
    return res
      .status(400)
      .json({ error: `${user.id} is already following ${targetId}` });
  }
  if (user.id === targetId) {
    return res.status(400).json({ error: "Cannot follow yourself" });
  }
  //$addToSet  neu mảng chưa có giá trị id đó thì mới thêm vào, có rồi ko thêm
  await userColl.updateOne( { id: user.id },{ $addToSet: { following: targetId } });

  res.status(200).json({ success: true });
});

api.delete(`/users/:id/follow`, async (req, res) => {
  let id = req.params.id; 
  let targetId = req.query.target;

  if (!targetId || targetId === "") {
    return res.status(400).json({
      error:
        "The query string is missing a target property, or target is empty",
    });
  }
  let user = await userColl.findOne({ id: id });
  let targetUser = await userColl.findOne({ id: targetId });
  if (!user || !targetUser) {
    return res.status(404).json({ error: "User id or target does not exist" });
  }
  //$pull dùng để xóa phần tử tương ứng với điều kiện  ra khỏi mảng 
  await userColl.updateOne({ id: id }, { $pull: { following: targetId } });

  res.status(200).json({ success: true });
});

/* This is a catch-all route that logs any requests that weren't handled above.
   Useful for seeing whether other requests are coming through correctly */
api.all("/*", (req, res) => {
  let data = {
    method: req.method,
    path: req.url,
    query: req.query,
    body: req.body,
  };
  console.log(data);
  res.status(500).json({ error: "Not implemented" });
});

export default initApi;
