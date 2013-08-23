// A keyword threshold based optimization algorithm.
// It checks the performance of a keyword
// and updates its bid accordingly.
// Poor performing "Enabled" keywords will be paused.

// Used for logging the messages to a spreadsheet
var SPREADSHEET_LOG_URL= 'https://docs.google.com/a/growth.gr/spreadsheet/ccc?key=0AlID7817xZmxdGEzdEdVd0FkU1VwX1QtVXNhYmswcFE#gid=0';
var SCRIPT_NAME ='Keyword Bidding Optimization';
var ACCOUNT='Gianna Kazakou';
// The campaigns to which the algorithm is applied to.
var campaigns={
  'Search.Brand': true  // true is just a pseudovalue
};
// Start and end date in for the performance data of a campaign.
var startDate='20130712';
var endDate = '20130731';

function main() {
  var keywords=getKeywords();
  applyBiddingStrategy(keywords);
}
// get all "enabled" keywords for all the "enabled" adwords campaigns specified in the "campaigns" object.
function getKeywords(){    
  var keywords=[];
  var campaignIt = AdWordsApp.campaigns()
  .withCondition("Status = ENABLED ")
  .get();
  while(campaignIt.hasNext()){
    var campaign = campaignIt.next();
    var name = campaign.getName();
    if(campaigns[name]){  
      var keywordIt = campaign.keywords()
      .withCondition("Status = ENABLED")
      .get();
      while(keywordIt.hasNext()){
        var keyword = keywordIt.next();
        keywords.push(keyword);   
      }
    }
  }
  return keywords;
}
// Apply the threshold based optimization algorithm for each keyword.
function applyBiddingStrategy(keywords){
  for(var i=0;i<keywords.length;i++){
    var keyword = keywords[i];
    var stats = keyword.getStatsFor(startDate,endDate);
    checkConversions(keyword,stats);
  }
}

function checkConversions(keyword,stats){
  var conversions = stats.getConversions();
  var cost = stats.getCost();
  if(conversions==0){
    checkCost(keyword,cost);
  }
  else if(0 < conversions && conversions <= 4){  
    var cpa = cost/ conversions;
    checkCPALower(keyword,cpa);
  }
  else{
    var cpa = cost/ conversions;
    checkCPAUpper(keyword,cpa);
  }
}

function checkCPALower(keyword,cpa){
  if(cpa<6){
    changeBid(keyword,0.15);
  }
  else if (6<=cpa && cpa<7.5){
    // nothing to do
  }
  else if(7.5<= cpa && cpa<=10){
    changeBid(keyword,-0.2);
  }
  else{
     changeBid(keyword,-0.25);
  }
}

function checkCPAUpper(keyword,cpa){
  if(cpa<6){
    changeBid(keyword,0.2);
  }
  else if (6<=cpa && cpa<7.5){
    // nothing to do 
  }
  else if(7.5<= cpa && cpa<=10){
    changeBid(keyword,-0.2);
  }
  else{
    changeBid(keyword,-0.3);
  }
}

function checkCost(keyword,cost){
  if(cost<10){
    // nothing to do
  }
  else if(10<=cost && cost<=18){
    changeBid(keyword,-0.3);
  }
  else{
    var msg='Pausing keyword:'+keyword.getText();
    Logger.log(msg);
    log(msg);
    keyword.pause();
  }
}
// Change default keyword bid by "cpc" units.
function changeBid(keyword,cpc){     
  var keywordCpc = keyword.getMaxCpc();
  keywordCpc = keywordCpc + keywordCpc * cpc;
  keywordCpc = Number(keywordCpc.toFixed(4));
  var msg='Changing keyword cpc: '+keyword.getText()+' from:'+keyword.getMaxCpc()+' to:'+keywordCpc;
  Logger.log(msg);
  log(msg);
  keyword.setMaxCpc(keywordCpc);
}
// Log the messages to a spreadsheet
function log(msg){
  var spreadsheet=SpreadsheetApp.openByUrl(SPREADSHEET_LOG_URL);
  var sheet=spreadsheet.getActiveSheet();
  var range = sheet.getRange(sheet.getLastRow()+1,1,1,4);
  var formattedDate = Utilities.formatDate(new Date(), "GMT+3", "yyyy-MM-dd");
  range.setValues([[formattedDate,ACCOUNT,SCRIPT_NAME,msg]]);
}