ok super now that i can login in as pateint successfully and the pateint dahsborad is working perfectly let's go on to next step that is working of pateint dahsobard:

there is two button: 
1.manage access 
2.view Records 


first let's complete view reocrds functionality i will explain the manage access part later:
in view records section currently there is two button to view public and private records what i want is to change that to when i click view Records button it shuld display all the data from both private and public cids here is the basic workflow of it :

pateint (for now me) will click the view Records button after successfully logining after clicking it hsould display the data stored in that cids that we will get primarly two cids private and public(can be mutliple)using that cds it needs to go the ipfs pinata and get the acutal data stored 

so bascially it will gte private cids from ethreum blockchain an duse standrad method to get the cids from that cids it will fetch the data stored in that cid from ipfs pinata

for public cids which is stored in mutlichain blockchain this is how the data is stored in multichian :
every pateint is stored in same stream 
and each data or unit or pateint is stored like this:
{
        "publishers" : [
            "19QFjMRAfj3mBscFEHf32BDLV1r6xbAsxNYnw9"
        ],
        "keys" : [
            "PAT251027-04684_2025-10-27T16:38:23.319Z"
        ],
        "offchain" : false,
        "available" : true,
        "data" : "7b22636964223a22516d61573331355042534b74584c7a6778416d4d7679313650596f76717134647656635470316e356d456438774c222c2274696d657374616d70223a22323032352d31302d32375431363a33383a32332e3331395a222c2276657273696f6e223a227631373631353833313033333139227d",
        "confirmations" : 4,
        "blocktime" : 1761583122,
        "txid" : "b8c40f788be890932dda65409e3227757da78c06c679e2503dd53852e0311689"
    }

as u can see here in keys the 'PAT251027-04684' is pateint id and rest is the timestamp at which the data is uploaded from here we need to get the cids of that particular pateint and using that cids we can get acutal data stored in ipfs pinata 


task:to do this correctly completely and check for errors and main thing is to not distrub the currrent wokring of admin and doctor dahsborad because they are wokring correctly and i don't want make any chnages there

ok best of luck!
