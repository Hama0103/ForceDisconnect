//予定保存用クラス
var Reservation = function(member,channelId,startTime) {
  this.member = member;
  this.channelId = channelId;
  this.startTime = startTime;
  this.endTime = new Date(startTime.getTime());
  //this.endTime.setMinutes(this.endTime.getMinutes()+5);
  //デモ用
  this.endTime.setSeconds(15);
  this.first = true;
};

//切断宣言が含まれているかのチェック
function AnalyzeMsg(str){
  if (str.match(/寝/)||str.match(/落/)){
    console.log(str.match(/\d{1,2}時\d{1,2}分/));
    console.log(str.match(/\d{1,2}:\d{1,2}/));
    if(str.match(/\d{1,2}時\d{1,2}分/)){
      var number = str.match(/\d{1,2}時\d{1,2}/); 
      number = number[0].split("時");
      console.log(number);
      return number;
    }else if(str.match(/\d{1,2}:\d{1,2}/)){
      var number = str.match(/\d{1,2}:\d{1,2}/); 
      number = number[0].split(":");
      console.log(number);
      return number;
    }else if(str.match(/\d{1,2}時/)){
      var number = str.match(/\d{1,2}/);
      number.push("0");
      console.log(number);
      return number;
    }
  }
  return null
}

const Eris = require("eris");
var bot = new Eris(process.env.BOT_TOKEN);

const nodeCron = require('node-cron');

var reservations = [];

bot.on("ready", () => {
  // botの準備できたら呼び出されるイベント
  console.log("Ready!");
});

bot.on("messageCreate", (msg) => {
  var content = AnalyzeMsg(msg.content);
  //時間の切断宣言&bot発言じゃ無い
  if(content) {
    //来たDateに合わせて開始時刻変更
    var date = new Date();
    if (date.getHours()>Number(content[0])){
      date.setHours(24+Number(content[0]));
      date.setMinutes(Number(content[1]));
      console.log(date.getHours()+":"+date.getMinutes());
    }else{
      date.setHours(Number(content[0]));
      date.setMinutes(Number(content[1]));
      console.log(date.getHours()+":"+date.getMinutes());
    }
    date.setSeconds(0);
    //登録
    var newRes = new Reservation(msg.member,msg.channel.id,date);
    reservations.push(newRes)

    bot.createMessage(newRes.channelId, newRes.member.username + "さんは"+newRes.startTime.getHours()+":"+newRes.startTime.getMinutes()+"に退出予定です");
  }
});

bot.on("voiceChannelJoin", (member, newChannel) => {
  // 入ってきたメンバーの予約がないか検知
  var now = new Date()
  var disconnects = reservations.filter(reservation => {
    return reservation.member.id === member.id && reservation.startTime < now && reservation.endTime > now;
  });

  //予約があるならさようなら
  for(var i = 0;i<disconnects.length;i++){
    disconnects[i].member.edit({channelID:null});
  }
});

//定期実行関数
var task = nodeCron.schedule('* * * * *', function() {
  //日付比較用変数
  var now = new Date();

  //5秒進める
  now.setSeconds(now.getSeconds()+3);

  //時間のものを絞り込み
  var disconnects = reservations.filter(reservation => {
    return reservation.startTime < now && reservation.endTime > now && reservation.first;
  });
  
  //切断とメッセージ送信
  for(var i = 0;i<disconnects.length;i++){
    disconnects[i].member.edit({channelID:null});
    disconnects[i].first = false;
    bot.createMessage(disconnects[i].channelId, disconnects[i].member.username + "さんお疲れ様でした");
  }
});

// タスクの実行
task.start();
// Discord に接続します。
bot.connect();