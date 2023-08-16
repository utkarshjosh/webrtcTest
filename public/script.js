const socket = io();
let userId = getCookie("_userId");
console.log("reading cooke", userId);
if (userId == "null" || userId == "undefined" || !userId) userId = undefined;
console.log("current val.normal", userId);
const videoGrid = document.getElementById("video-grid");
const myPeer = new Peer(userId);

const myVideo = document.createElement("video");
myVideo.muted = true;
const peers = {};
let activeRec = [];
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    addVideoStream(myVideo, stream);
    // once we are ready

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream); // sending my stream
    });
    if (activeRec.length) {
      console.log("found existing users", activeRec);
      activeRec.forEach((userId) => {
        connectToNewUser(userId, stream);
      });
    }
    myPeer.on("call", (call) => {
      call.answer(stream); // sending my stream
      const video = document.createElement("video");
      call.on("stream", (userVideoStram) => {
        addVideoStream(video, userVideoStram); // add callers stream
      });
    });
  });

myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
  setCookie("_userId", id);
});

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) {
    peers[userId].close();
  }
});

socket.on("curr-users", (liveUsers) => {
  activeRec = liveUsers;
});

addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
};
connectToNewUser = (userId, stream) => {
  if (peers[userId]) return;
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStram) => {
    addVideoStream(video, userVideoStram);
  });
  call.on("close", () => {
    video.remove();
  });
  peers[userId] = call; // storing call object of every user called
};

function setCookie(cName, cValue, expDays) {
  let date = new Date();
  date.setTime(date.getTime() + expDays * 24 * 60 * 60 * 1000);
  const expires = "expires=" + date.toUTCString();
  document.cookie = cName + "=" + cValue + "; " + expires + "; path=/";
}

function getCookie(cName) {
  const name = cName + "=";
  const cDecoded = decodeURIComponent(document.cookie); //to be careful
  const cArr = cDecoded.split("; ");
  let res;
  cArr.forEach((val) => {
    if (val.indexOf(name) === 0) res = val.substring(name.length);
  });
  return res;
}
