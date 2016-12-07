// Description:
//   Let Hubot store daily status updates for your team
//
//   The output is tailored for Slack and assumes existence of Markdown's code markers,
//   but should work well for others as well.
//
// Commands:
//   hubot daily update help - List of commands
//   hubot my update is <message> - Tell hubot about an update. You can tell hubot about how many updates you want in a day.
//   hubot get daily updates by <username> - Gets all of today's updates for a user
//   hubot get daily updates - Gets all daily updates for all users for today
//   hubot get all daily updates for yesterday - Gets all daily updates for all users for yesterday
//   hubot get all daily updates for last week for <room> - Gets all daily updates for all users for last week (Maybe a good idea to always use this in private chat with me)
//   hubot get all daily updates for <X> days ago - Gets all daily updates for all users for X days ago
//   hubot remove daily updates on <YYYY-MM-DD> by <username> - Removes all updates on a given date by a given user
//   hubot remove daily updates by <username> - Removes all updates by a given user
//   hubot remove daily updates for room - Removes all updates for the current room
//
// Dependencies:
//   lodash
//   moment

var _ = require('lodash-node');
var moment = require('moment');

module.exports = function(robot) {

    robot.respond(/my update is((.*\s*)+)/i, function(msg) {
      var dailyUpdate = msg.match[1].trimLeft();  // Trimming the leading (left) whitespaces
      var username = msg.envelope.user.name;
      if(dailyUpdate.length > 0) {
        var room = msg.envelope.user.room;
        var today = getToday();
        var messages = getRoomMessages(room);
        messages[username] = messages[username] || {};
        // Always override the earlier update for today.
        // messages[username][today] = messages[username][today] || [];
        messages[username][today] = [dailyUpdate];

        saveRoomMessages(room, messages);

        msg.send('Sure ' + username + ', added your daily update.');
      } else {
        msg.send('Sorry ' + username + ', your update is empty. Try again');
      }
    });

    robot.respond(/get daily updates by (\w*)/i, function(msg) {
      var username = msg.match[1];
      var requester_username = msg.envelope.user.name;
      var room = msg.envelope.user.room;
      var today = getToday();
      var messages = getRoomMessages(room);

      if(username.length === 0)
        return msg.send(requester_username + ', you need to supply a user name');
      if(!(username in messages))
        return msg.send('This user(' + username + ') does not exist or has never stored any updates');
      if(!(today in messages[username]) || messages[username][today].length === 0)
        return msg.send('No daily updates for this user(' + username + ') yet');

      msg.send(
        'Daily update of '+today+' by '+username+':\n'+
        renderMessages(messages[username][today])+
        '\n'
      );
    });

    robot.respond(/get daily updates/i, function (msg) {
      if(msg.match.input.length === msg.match[0].length){
        var today = getToday();
        msg.send(getDailyUpdates(msg.envelope.user.room, today));
      }
    });

    robot.respond(/get all daily updates for yesterday/i, function (msg) {
      msg.send(getDailyUpdates(msg.envelope.user.room, getToday(-1)));
    });

    robot.respond(/get all daily updates for last week for ([#|\w|\d|_|-]+)/i, function (msg) {
      var room = msg.match[1];
      console.log(room);
      var output = '';
      for(var i=7; i>=0; i--){
        output += getDailyUpdates(room, getToday(-i))+'\n';
      }
      msg.send(output);
    });

    robot.respond(/get all daily updates for (\d+) days ago/i, function (msg) {
      var day = parseInt(msg.match[1], 10);
      msg.send(getDailyUpdates(msg.envelope.user.room, getToday(-day)));
    });

    robot.respond(/remove daily updates on ([\d|-]+) by (\w+)/i, function (msg) {
      var date = msg.match[1];
      var username = msg.match[2];
      var room = msg.envelope.user.room;
      var roomMessages = getRoomMessages(room);
      if(!(username in roomMessages))
        return msg.send(username+' had no updates anyway');
      if(!(date in roomMessages[username]))
        return msg.send(username+' had no updates on '+date+' anyway');
      roomMessages[username][date] = [];
      saveRoomMessages(room, roomMessages);
      msg.send('removed all updates for '+username+' on '+date);
    });

    robot.respond(/remove daily updates by (\w+)/i, function (msg) {
      var username = msg.match[1];
      var room = msg.envelope.user.room;
      var roomMessages = getRoomMessages(room);
      if(!(username in roomMessages))
        return msg.send(username+' had no updates anyway');
      roomMessages[username] = {};
      saveRoomMessages(room, roomMessages);
      msg.send('removed all updates for '+username);
    });

    robot.respond(/remove daily updates for room/i, function (msg) {
      var room = msg.envelope.user.room;
      saveRoomMessages(room, null);
      msg.send('removed all updates for '+room);
    });

    function getDailyUpdates(room, currentDay) {
      var messages = getRoomMessages(room);

      if(_.keys(messages).length === 0) {
        return 'No updates for '+currentDay+' yet';
      }

      var output = '';
      var day;
      _.each(messages, function (days, username) {
        output += 'Updates for '+username+' on '+currentDay+':\n';
        day = currentDay in days ? days[currentDay] : [];
        if(day.length > 0){
          output += renderMessages(day);
        } else {
          output += '- No updates yet';
        }
        output += '\n';
      });

      return output;
    }

    function getRoomMessages(room) {
      return robot.brain.get('daily-updates:'+room) || {};
    }

    function saveRoomMessages(room, messages) {
      robot.brain.set('daily-updates:'+room, messages);
    }

    function renderMessages(messages) {
      return _.map(messages, function (update) {
        return '- '+update;
      }).join('\n');
    }

    function getToday(minus) {
      var today = moment();
      if(minus) today.subtract(-minus, 'days');
      return today.format('YYYY-MM-DD');
    }

    robot.respond(/daily update help/i, function(msg) {
        var message = [];
        message.push("I'll store your status updates!");
        message.push("I can store as many status updates per day as you want. Just tell me about what you did. Here's how you can do it:");
        message.push("");
        message.push(robot.name + " my update is <message> - Tell hubot about an update. You can tell hubot about how many updates you want in a day.");
        message.push(robot.name + " get daily updates by <username> - Gets all of today's updates for a user");
        message.push(robot.name + " get daily updates - Gets all daily updates for all users for today");
        message.push(robot.name + " get all daily updates for yesterday - Gets all daily updates for all users for yesterday");
        message.push(robot.name + " get all daily updates for last week for <room> - Gets all daily updates for all users for last week (Maybe a good idea to always use this in private chat with me)");
        message.push(robot.name + " get all daily updates for <X> days ago - Gets all daily updates for all users for X days ago");
        message.push(robot.name + " remove daily updates on <YYYY-MM-DD> by <username> - Removes all updates on a given date by a given user");
        message.push(robot.name + " remove daily updates by <username> - Removes all updates by a given user");
        message.push(robot.name + " remove daily updates for room - Removes all updates for the current room");


        msg.send(message.join('\n'));
    });
};
