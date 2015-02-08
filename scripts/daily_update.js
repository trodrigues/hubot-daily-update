// Description:
//   Let Hubot store daily status updates for your team
//
//   The output is tailored for Slack and assumes existence of Markdown's code markers,
//   but should work well for others as well.

//
// Commands:
//   hubot daily update help - List of commands
//   hubot my update is - Tell hubot about an update. You can tell hubot about how many updates
//                        you want in a day.
//   hubot get daily updates for user - Gets all of today's updates for a user
//   hubot get all daily updates - Gets all daily updates for all users for today
//   hubot get all daily updates for yesterday - Gets all daily updates for all users for yesterday
//   hubot get all daily updates for X days ago - Gets all daily updates for all users for X days ago
//
//
// Dependencies:
//   lodash
//   moment

var _ = require('lodash-node');
var moment = require('moment');

module.exports = function(robot) {

    robot.respond(/my update is (.*)/i, function(msg) {
      var dailyUpdate = msg.match[1];
      if(dailyUpdate.length > 0) {
        var username = msg.envelope.user.name;
        var room = msg.envelope.user.room;
        var today = getToday();
        var messages = getRoomMessages(room);
        messages[username] = messages[username] || {};
        messages[username][today] = messages[username][today] || [];
        messages[username][today].push(dailyUpdate);

        robot.brain.set('daily-standup:'+room, messages);

        msg.send('added your daily update');
      } else {
        msg.send('Sorry, your update is empty. Try again');
      }
    });

    robot.respond(/get daily updates for (\w*)/i, function(msg) {
      var username = msg.match[1];
      var room = msg.envelope.user.room;
      var today = getToday();
      var messages = getRoomMessages(room);

      if(username.length === 0)
        return msg.send('You need to supply a user name');
      if(!(username in messages))
        return msg.send('This user does not exist or has never stored any updates');
      if(!(today in messages[username]) || messages[username][today].length === 0)
        return msg.send('No daily updates for this user yet');

      msg.send(
        'Daily update of '+today+' for '+username+':\n```\n'+
        renderMessages()+
        '\n```'
      );
    });

    robot.respond(/get all daily updates/i, function (msg) {
      if(msg.match.input.length === msg.match.length){
        var today = getToday();
        getDailyUpdates(msg, today);
      }
    });

    robot.respond(/get all daily updates for yesterday/i, function (msg) {
      getDailyUpdates(msg, getToday(-1));
    });

    robot.respond(/get all daily updates for (\d+) days ago/i, function (msg) {
      var day = parseInt(msg.match[1], 10);
      getDailyUpdates(msg, getToday(-day));
    });

    function getDailyUpdates(msg, currentDay) {
      var room = msg.envelope.user.room;
      var messages = getRoomMessages(room);

      if(_.keys(messages).length === 0) {
        return msg.send('No updates for '+currentDay+' yet');
      }

      var output = '';
      var day;
      _.each(messages, function (days, username) {
        output += 'Updates for '+username+':\n';
        day = currentDay in days ? days[currentDay] : [];
        if(day.length > 0){
          output += renderMessages(day);
        } else {
          output += '- No updates yet';
        }
        output += '\n';
      });

      msg.send(output);
    }

    function getRoomMessages(room) {
      return robot.brain.get('daily-standup:'+room) || {};
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
        message.push(robot.name + " create standup hh:mm - I'll remind you to standup in this room at hh:mm every weekday.");
        message.push(robot.name + " my update is - Tell hubot about an update. You can tell hubot about how many updates you want in a day.");
        message.push(robot.name + " get daily updates for user - Gets all of today's updates for a user");
        message.push(robot.name + " get all daily updates - Gets all daily updates for all users for today");
        message.push(robot.name + " get all daily updates for yesterday - Gets all daily updates for all users for yesterday");
        message.push(robot.name + " get all daily updates for X days ago - Gets all daily updates for all users for X days ago");

        msg.send(message.join('\n'));
    });
};
