const { Client, Events, GatewayIntentBits, shouldUseGlobalFetchAndWebSocket, VoiceRegion, getInitialSendRateLimitState } = require('discord.js');
let fs = require('fs');
const { token } = require('./config.json');
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
let MemoryTemplate = {
    "Bank": {"555":0},
    "Admins" : ["555","569611563745542174"]
}


//////////////////////////
//  Making Thoughts     //
//////////////////////////


//Basic Checkers//
function IsMessage(message,Checking){
    if (message.content == Checking){
        return true
    }
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

function HasEnoughMoney(message,Amount){
    let id = message.author.id
    initBank(id)
    return BankBalance(id) >= Amount
}

function IsAdmin(message){
    return Memory.Admins.includes(message.author.id)
}

//Basic Responses//
function SendMessage(message,ToSend){
    message.reply(ToSend)
    return true
}

function GiveMoney(message,Amount){
    let id = message.author.id
    let Bank = Memory.Bank
    initBank(id)
    let BaseAmount = Bank[id]
    Bank[id] = BaseAmount + Amount
}


//Utility//

function BankBalance(id){
    return Memory.Bank[id]
}


function PayUser(Donerid,Recipientid,Amount){
    GiveMoney(Donerid,-Amount)
    GiveMoney(Recipientid,Amount)
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

//Initialise Bank
function initBank(id){

    if (Memory.Bank[id] == undefined){
        Memory.Bank[id] = 0
    }
}

//Initialise Memory
function initMemory(){
    Memory = MemoryTemplate
}

//Add Attention
function PayAttention(Listener){
    Attention.OnMessage.push(Listener)
}

//Add Heartbeat
function StartTask(Task){
    Heartbeat.push(Task)
}

//Run Functions Recursively
//INPUT : message, Statement
function RecursiveFunction(message, Statement) {
    let NewArgs = []
    Statement.Arguments.forEach(Argument => {
        if(Argument == undefined){
            NewArgs.push(message)
            return
        }
        if(typeof Argument != "object"){
            NewArgs.push(Argument)
            return
        }
        NewArgs.push(RecursiveFunction(message,Argument))
    });

    return Statement.Function.apply(null,NewArgs)
}

//////////////////////////
//  Setting Routines    //
//////////////////////////


//Setting Memory Upon Awake
Recall()

//On Message Attention Seeker
client.on('messageCreate', async message => {
    if (message.author.id == client.user.id){
        return
    }
    let i = Attention.OnMessage.length 
    while (i--){
        let Seeker = Attention.OnMessage[i]
        let Results = true
        Seeker.Checkers.forEach(element => {
            let Result = element
            if (typeof element == "object"){
                Result = RecursiveFunction(message,element) 
            }
            if(Result == false){
                Results = false
            }
        });
        if (Results == false){
            continue
        }

        Seeker.Responses.forEach(element => {
            let Result = element
            if (typeof element == "object"){
                Result = RecursiveFunction(message,element) 
            }
            if(Result == false){
                Results = false
            }
        });
        if (Results == false){
            Attention.OnMessage.splice(i,1)
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

//Templates

let ExampleSeeker = {
    "Checkers": [],
    "Responses":[]
}

let ExampleChecker = {
    "Function": StartsWith,
    "Arguments": []
}

let ExampleResponse = {
    "Function": console.log,
    "Arguments": []
} 

let MirrorMessage = {
    "Function":SendMessage,
    "Arguments": [undefined,{
        "Function": (b)=>{return b},
        "Arguments": [undefined]
    }]
}

let AdminCheck = {
    "Function": IsAdmin,
    "Arguments": [undefined]
}

PayAttention({
    "Checkers": [{
        "Function":IsMessage,
        "Arguments": [undefined,"take"]
    },AdminCheck],
    "Responses":[MirrorMessage,{
        "Function":GiveMoney,
        "Arguments":[undefined,-500]
    }]
})



//Adding Memory To Heartbeat
StartTask([200,Store])
StartTask([5,() => {console.log(Memory.Bank)}])


initMemory()
