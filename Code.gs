var _ = Underscore.load();
var moment = Moment.load();
var userProperties = PropertiesService.getUserProperties();
var scriptProperties = PropertiesService.getScriptProperties();
var queryParams = JSON.parse(userProperties.getProperty('params'));

var titleRows = 2;
var auditColumns = 2;
var createdBy = 1;
var dateFormat = 'YYYY-MM-DD';
var version = "2";

function doPost(e) {
  
  var sh;
  queryParams = {};
  queryParams.spreadsheetId = e.parameter['spreadsheetId'];
  console.info(e.parameter['spreadsheetId']);
  var data = JSON.parse(e.postData.contents); 
      for(var i = 0; i < data.length; i++) {
        var update = data[i];
        if (update.updateType == 'UPDATE'){
          console.info(JSON.stringify(update));
          var s = getSpreadsheet().getSheetByName(update.model.toLowerCase());
          console.info(JSON.stringify(_updateObject(s,update.uuid,update.object,update.date)));
        }
        if (update.updateType == 'CREATE'){
          console.info(JSON.stringify(update));
          var s = getSpreadsheet().getSheetByName(update.model.toLowerCase());
          console.info(JSON.stringify(_createObject(s,update.uuid,update.object)));
        }
      }

  var res = {"result":"OK"};
  return response().json(res); 

}
/**
* Renders html output
*
* @param {object} e the query parameter object
*/
function doGet(e) {
    console.info(e.parameter['operation']);
    if (e.parameter['operation'] == 'get'){
      queryParams = {};
      queryParams.spreadsheetId = e.parameter['spreadsheetId'];
      return response().json(getAllRowsJSONObject(e.parameter['entity'])); 
    }
    if (e.parameter['operation'] == 'getAll'){
      queryParams = {};
      queryParams.spreadsheetId = e.parameter['spreadsheetId'];
      return response().json(getAllEntitiesJSONObject()); 
    }
    if (e.parameter['operation'] == 'login'){
      queryParams = {};
      queryParams.spreadsheetId = e.parameter['spreadsheetId'];
      return response().json(login(e.parameter['user'],e.parameter['password'])); 
    }
   

    return response().json({'error':'operation not found'}); 
};

function response() {
   return {
      json: function(data) {
         return ContentService
            .createTextOutput(JSON.stringify(data))
            .setMimeType(ContentService.MimeType.JSON);
      }
   }
}

