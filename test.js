import { MongoClient } from "mongodb";

const DATABASE_NAME = "assign3-2";
let postColl;
let userColl;

const main = async () => {
  const conn = await MongoClient.connect(`mongodb://localhost`);
  const db = conn.db(DATABASE_NAME);
  postColl = db.collection(`posts`);
  userColl = db.collection(`users`);

  let allUsers = await userColl.find().toArray();

 console.log(allUsers);
//   await userColl.insertOne({
//     id: "mtien",
//     name: "Tien",
//     avatarURL: "images/profile_red.png",
//     following: [],
//   });
    // await userColl.deleteOne({id:`mtien`});
  // let user = await userColl.findOne({id : "mchang"});
  // console.log(user.id);
};
main();

const userData = {
  user: [
    {
      id: "mchang",
      name: "Michael",
      avatarURL: "images/stanford.png",
      following: [],
    },
    {
      id: "mtien",
      name: "Tien",
      avatarURL: "images/profile_red.png",
      following: [],
    },
  ],
};
