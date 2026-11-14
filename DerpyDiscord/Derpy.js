const { Client, Events, GatewayIntentBits, shouldUseGlobalFetchAndWebSocket } = require('discord.js');
let fs = require('fs');
const { token } = require('./config.json');
const { checkPrime } = require('crypto');
const client = new Client({ intents: [GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,] });

client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});
client.login(token);


let Heartbeat = []
let Attention = {"OnMessage":[]}
let Cycle = 0


//Memory
let Memory = {
    "Money": {555:0},
    "Admins" : [555,569611563745542174]
}


//////////////////////////
//  Making Thoughts     //
//////////////////////////


//Checkers//

function IsMessage(message,Checking){
    if (message.content == Checking){
        return true
    }
    console.log("False Check")
    return false
}

function Contains(message,Checking){
    return message.content.includes(Checking) 
}

function StartsWith(message,Checking){
    let CheckingLength = Checking.length
    let NewContent = message.content.slice(0,CheckingLength)
    if (NewContent.toLowerCase()== Checking.toLowerCase()){
        return true
    }
    return false
    
}

//Responses//

function SendMessage(message,ToSend){
    message.reply(ToSend)
    return true
}

//////////////
//  Misc    //
//////////////


//Recall Memory
function Recall(){
    let LongTerm = fs.readFileSync('memory.json', 'utf8')
    Memory = JSON.parse(LongTerm)
}

//Store Memory
function Store(){
    let Thoughts = JSON.stringify(Memory)
    fs.writeFileSync("memory.json", Thoughts);

}


//////////////////////////
//  Setting Routines    //
//////////////////////////


//Setting Memory Upon Awake
Recall()

//On Message Attention Seeker
client.on('messageCreate', async message => {
    let ShortTerm = []
    if (message.author.id == client.user.id){
        return
    }
    let i = Attention.OnMessage.length 
    while (i--){
        let Listener = Attention.OnMessage[i]
        

        if (typeof Listener[0] == "function"){
            Listener = [[[Listener[0],Listener[1]]],Listener[2],Listener[3]]
        }

        let Checkers = Listener[0]
        let AllTrue = true
        Checkers.forEach(Checker => {
            console.log("Checker",Checker)
            if (Checker[0](message,Checker[1]) == false){
                AllTrue = false
            }
        });
        


        if (AllTrue == true){
            let Response = Listener[1](message,Listener[2])
            if (Response == false){
                Heartbeat.splice(i,1)
            }
        }
    };
})

//Heartbeat
setInterval(() => {
    let i = Heartbeat.length
    while (i--){
            let Task = Heartbeat[i]
            if (Cycle % Task[0] == 0){
                let Response = Task[1]()
                if (Response == false){
                    Heartbeat.splice(i,1)
                }
            }
    }
    Cycle++
}, 100);


//////////////////////////
//  Setting Processes   //
//////////////////////////


//Adding Function To Attention
Attention.OnMessage.push([IsMessage,"hi",SendMessage,"hi"])
Attention.OnMessage.push([StartsWith,"hi",SendMessage,"hi2"])
Attention.OnMessage.push([[[Contains,"hi"],[Contains,"lol"]],SendMessage,"hi3"])

//Adding Memory To Heartbeat
Heartbeat.push([200,Store])

