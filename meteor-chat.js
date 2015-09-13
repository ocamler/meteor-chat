Messages = new Meteor.Collection("messages");
Rooms = new Meteor.Collection("rooms");

if (Meteor.isClient) {
  Accounts.ui.config({
    passwordSignupFields: 'USERNAME_ONLY'
  });

  var rooms = Meteor.subscribe("rooms");
  Meteor.subscribe("messages");

  $(window).bind('hashchange', function(){
    var room = (window.location.hash).substr(1);
    if ($.trim(room).length && !Rooms.find({'roomname': room}).count()) {
      Rooms.insert({roomname: room}); // create room if it doesn't exist
    }
    Session.set("roomname", room);
  });

  Template.input.events({
    'click .sendMsg': function(e) {
       _sendMessage();
    },
    'keyup #msg': function(e) {
      if (e.type == "keyup" && e.which == 13) {
        _sendMessage();
      }
    }
  });

  _sendMessage = function() {
    var el = document.getElementById("msg");
    Messages.insert({user: Meteor.user().username, msg: el.value, ts: new Date(), room: Session.get("roomname")});
    el.value = "";
    el.focus();
  };

  Template.messages.helpers({
    messages: function() {
      return Messages.find({room: Session.get("roomname")}, {sort: {ts: -1}});
    },
    roomname: function() {
      return Session.get("roomname");
    }
  });
  
  Template.message.helpers({
    timestamp: function() {
      return this.ts.toLocaleString();
    }
  });

  Template.rooms.events({
    'click li': function(e) {
      window.location.hash = e.target.innerText;
    },
    'keyup #newRoom': function(e) {
      if (e.keyCode == 13) { // return
        $("#newRoomSubmit").click();
      }
    },
    'click #newRoomSubmit': function(e) {
      var room = $.trim($("#newRoom").val());
      if (room.length) {
        window.location.hash = room;
        $("#newRoom").val('');
      }
      e.preventDefault(); // prevent hash from changing any further
    }
  });
  
  Template.rooms.helpers({
    rooms: function() {
      return Rooms.find();
    }
  });
  
  Template.room.helpers({
    roomstyle: function() {
      return Session.equals("roomname", this.roomname) ? "font-weight: bold" : "";
    }
  });

  Template.chat.helpers({
    release: function() {
      return Meteor.release;
    }
  });

  Meteor.autorun(function () {
    if (rooms.ready()) {
      // figure out which room to start in
      var room = (window.location.hash).substr(1);
      if (room && Rooms.find({'roomname': room}).count()) {
        Session.setDefault("roomname", room);
      } else {
        Session.setDefault("roomname", "Meteor"); // default
      }
    }
  });

  Meteor.subscribe("userStatus");

  Template.users.helpers({
    online: function() {
      return Meteor.users.find({ "status.online": true });
    }
  });

  Template.userPill.helpers({
    labelClass: function() {
      if (this.status.idle)
        return "label-warning";
      else if (this.status.online)
        return "label-success";
      else
        return "label-default";
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // Don't automatically wipe previous messages on restart
    //Messages.remove({});
    //Rooms.remove({});
    if (Rooms.find().count() === 0) {
      ["Meteor", "JavaScript", "Reactive", "MongoDB"].forEach(function(r) {
        Rooms.insert({roomname: r});
      });
    }
  });
  
  Rooms.deny({
    insert: function (userId, doc) {
      return (userId === null);
    },
    update: function (userId, doc, fieldNames, modifier) {
      return true;
    },
    remove: function (userId, doc) {
      return true;
    }
  });
  Rooms.allow({
    insert: function (userId, doc) {
      return (userId !== null);
    }
  });
  Messages.deny({
    insert: function (userId, doc) {
      return (userId === null);
    },
    update: function (userId, doc, fieldNames, modifier) {
      return true;
    },
    remove: function (userId, doc) {
      return true;
    }
  });
  Messages.allow({
    insert: function (userId, doc) {
      return (userId !== null);
    }
  });
  
  Meteor.publish("rooms", function () {
    return Rooms.find();
  });
  Meteor.publish("messages", function () {
    return Messages.find({}, {sort: {ts: -1}});
  });

  Meteor.publish("userStatus", function() {
    return Meteor.users.find({ "status.online": true }, { fields: { "username": 1, "status": 1 } });
  });
}
