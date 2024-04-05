import FollowList from "./followlist.js";
import User, { Post } from "./user.js";

export default class App {
  constructor() {
    /* Store the currently logged-in user. */
    this._user = null;

    this._onListUsers = this._onListUsers.bind(this);

    this._onLogin = this._onLogin.bind(this);
    this._onMakePost = this._onMakePost.bind(this);
    this._onSaveName = this._onSaveName.bind(this);
    this._onSaveAvatar = this._onSaveAvatar.bind(this);
    // this._onMakePost = this._onMakePost.bind(this);

    this._loginForm = document.querySelector("#loginForm");
    this._loginForm.listUsers.addEventListener("click", this._onListUsers);
    this._loginForm.login.addEventListener(`click`, this._onLogin);

    this._nameSubmit = document.querySelector("#nameSubmit");
    this._nameSubmit.addEventListener(`click`, this._onSaveName);
    this._avatarSubmit = document.querySelector(`#avatarSubmit`);
    this._avatarSubmit.addEventListener(`click`, this._onSaveAvatar);
    //TODO: Initialize any additional private variables/handlers, and set up the FollowList

    this._followList = new FollowList(
      document.querySelector("#followContainer"),
      this._onAddFollow.bind(this),
      this._onRemoveFollow.bind(this)
    );

    this._postForm = document.querySelector("#postForm");
    this._postForm.addEventListener("click", this._onMakePost);
  }

  /*** Event handlers ***/

  async _onListUsers() {
    let users = await User.listUsers();
    let usersStr = users.join("\n");
    alert(`List of users:\n\n${usersStr}`);
  }

  async _onLogin(event) {
    event.preventDefault();
    let userId = this._loginForm.userid.value;
    try {
      if (userId) {
        this._user = await User.loadOrCreate(userId);
        await this._loadProfile();
      }
    } catch (error) {
      alert(`User does not exist`);
    }
  }

  //TODO: Add your event handlers/callback functions here

  async _onMakePost(event) {
    event.preventDefault();
    const text = this._postForm.querySelector("#newPost").value;
    await this._user.makePost(text);
    this._loadProfile();
  }
  async _onAddFollow(userId) {
    try {
      await this._user.addFollow(userId);
      await this._loadProfile();
    } catch (error) {
      alert(`
      User does not exist 
      You are already following this user
      Can't follow your self`);
    }
  }
  async _onRemoveFollow(userId) {
    try {
      await this._user.deleteFollow(userId);
      await this._loadProfile();
    } catch (error) {
      alert(`Failed to remove follow`);
    }
  }

  async _onSaveName(event){
    event.preventDefault();
    const newName = document.querySelector("#nameInput").value;
    this._user.name = newName;
    await this._user.save();
    await this._loadProfile();
  }

  async _onSaveAvatar(event) {
  event.preventDefault();
    const newAvatar = document.querySelector("#avatarInput").value;
    this._user.avatarURL = newAvatar;
    await this._user.save();
    await this._loadProfile();
  }

  /* Add the given Post object to the feed. */
  async _displayPost(post) {
     /* Make sure we receive a Post object. */
    if (!(post instanceof Post)) throw new Error("displayPost wasn't passed a Post object");

    let elem = document.querySelector("#templatePost").cloneNode(true);
    elem.id = "";

    let avatar = elem.querySelector(".avatar");
    avatar.src = post.user.avatarURL;
    avatar.alt = `${post.user}'s avatar`;

    elem.querySelector(".name").textContent = post.user;
    elem.querySelector(".userid").textContent = post.user.id;
    elem.querySelector(".time").textContent = post.time.toLocaleString();
    elem.querySelector(".text").textContent = post.text;

    document.querySelector("#feed").append(elem);
  }

  /* Load (or reload) a user's profile. Assumes that this._user has been set to a User instance. */
  async _loadProfile() {
    //lay user hien tai
    let userId = this._loginForm.userid.value;
    this._user = await User.loadOrCreate(userId);

    document.querySelector("#welcome").classList.add("hidden");
    document.querySelector("#main").classList.remove("hidden");
    document.querySelector("#idContainer").textContent = this._user.id;

    //sidebar
    document.querySelector(`#sidebar`).classList.add(`paper`);
    /* Reset the feed. */
    document.querySelector("#feed").textContent = "";

    /* Update the avatar, name, and user ID in the new post form */
    this._postForm.querySelector(".avatar").src = this._user.avatarURL;
    this._postForm.querySelector(".name").textContent = this._user;
    this._postForm.querySelector(".userid").textContent = this._user.id;

    // Load user data into sidebar
    const nameInput = document.querySelector("#nameInput");
    const avatarInput = document.querySelector("#avatarInput");
    nameInput.value = this._user.name; // Đặt giá trị của tên người dùng vào input tên
    avatarInput.value = this._user.avatarURL;

    //setlist
    this._followList.setList(this._user.following);

    //TODO: Update the rest of the sidebar and show the user's feed
    let feed = await this._user.getFeed();
    // feed.forEach((post) => this._displayPost(post));
    for (const post of feed) {
      this._displayPost(post);
    }
  }
}
