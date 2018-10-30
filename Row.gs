function submitForm(atts) {

    var s = getSpreadsheet().getSheetByName(atts.sheetName);

    var columns = getColumnNames(atts.sheetName);

    var isNew = atts.formValues[0] === '';
    atts.formValues[1] = Session.getActiveUser().getEmail();

    if(isNew) {
        var result = _appendRow(s, atts.formValues);
    } else {
        var result = _updateRow(s, atts.formValues);
    }

    runTriggers(atts.sheetName, isNew, result);

    return {'rowId': result[0]};

}


function _appendRow(s, values) {

    var lastId = s.getRange(_getLastRowWithData(s), 1).getValue();
    values[0] = Utilities.getUuid();
    //_.isNumber(lastId) ? lastId + 1 : 1;

    var sheetName = s.getName();
    var columnNames = getColumnNames(sheetName);

    _.each(values, function(c, index) {

        if(columnNames[1][index]['type'].indexOf('formula') > -1) {
            values[index] = '';
        }
        
        if(columnNames[0][index].indexOf('uuid') > -1 && (values[index] == null || values[index] == '')) {
            values[index] = Utilities.getUuid();
        }
        
       
    });

    // The append row method doesn't detect the validations at first, so appending a row with invalid data is possible.
    // That's why this is necessary to catch errors right away. Not the most elegant way, think about alternatives.
    try {

        var result = s.getRange(_getLastRowWithData(s) + 1, 1, 1, s.getLastColumn()).setValues([values]);
        SpreadsheetApp.flush();

    } catch (e) {

        deleteRow({'sheetName': s.getName(), 'rowId': values[0]});
        throw e;

    }

    return findRow(s.getName(), values[0]);

}


function duplicateRow(atts) {

    var s = getSpreadsheet().getSheetByName(atts.sheetName);
    var values = findRow(atts.sheetName, atts.rowId);

    _appendRow(s, values);

    return {'rowId': values[0]};

}


function deleteRow(atts) {

    var s = getSpreadsheet().getSheetByName(atts.sheetName);

    var position = getRowPosition(s, atts.rowId);

    if(position > -1) {
        s.deleteRow(position);
    } else {
        throw 'No record found with this id';
    }

}


function getRowPosition(s, rowId) {

//    var ids = _.map(
//              _.flatten(_getFullDataRange(s, 1, 1).getValues()), function(id) { return Number(id); }
//                );
    var ids = _.map(
              _.flatten(_getFullDataRange(s, 1, 1).getValues()), function(id) { return id.toString(); }
                );
    console.info(ids);
    console.info(rowId);
    var index = ids.indexOf(typeof rowId === 'string' ? rowId : rowId.toString());
    console.info(index);
    return index > - 1 ? index + 1 : -1;

}


function updateCell(atts) {

    var s = getSpreadsheet().getSheetByName(atts.sheetName);

    var position = getRowPosition(s, atts.rowId);
    var range = s.getRange(position, atts.columnIndex + 1).setValue(atts.value);

    var row = findRow(atts.sheetName, atts.rowId);
    runTriggers(atts.sheetName, false, row);

}


function _updateRow(s, values) {
    var sheetName = s.getName();
    var columnNames = getColumnNames(sheetName);
    //var values = findRow(sheetName, values[0]);
    console.info(columnNames);
    console.info("new values: " + JSON.stringify(values));
    _.each(values, function(c, index) {        
        if(columnNames[0][index].indexOf('uuid') > -1 && (values[index] == null || values[index] == '')) {
            values[index] = Utilities.getUuid();
        }
        if(columnNames[1][index]['type'] == 'date' && (values[index] != null && values[index] != '')){
          values[index] = moment(values[index]).format('YYYY-MM-DD');
        }
    });
    var position = getRowPosition(s, values[0]);
    console.info(JSON.stringify(values));
    s.getRange(position, 1, 1, s.getLastColumn()).setValues([values]);

    return findRow(s.getName(), values[0]);

}

function _updateObject(s,uuid, newvalues, date) {
    var sheetName = s.getName();
    var columnNames = getColumnNames(sheetName);
    console.info(JSON.stringify(uuid));
    var values = findRow(sheetName, uuid);
    console.info("current:" +JSON.stringify(values));
    console.info("new:" +JSON.stringify(newvalues));
    _.each(columnNames[0], function(c, index) {  
        console.info(JSON.stringify(c));
        if (typeof newvalues[c] !== undefined && newvalues[c] != null){
           console.info("update:" + newvalues[c]);
          if(columnNames[1][index]['type'] == 'date'){
            values[index] = moment(newvalues[c]).format('YYYY-MM-DD');
          }
          else {
            values[index] = newvalues[c];
          }
        }
        
    });
    console.info(JSON.stringify(values));
    var position = getRowPosition(s, uuid);
    if (position > 0){
      s.getRange(position, 1, 1, s.getLastColumn()).setValues([values]);
      console.info("_updateObject -> sheetName" + sheetName); 
      if(sheetName == 'territory'){
        var assigns = selectRowsWhere('assignments', 'territory', uuid);
        console.info("assigns :" + JSON.stringify(assigns));
        if (assigns.length == 0){
          console.info("append :" + JSON.stringify(['','',newvalues['uuid'],newvalues['assignedPublisher'],moment(date).format('YYYY-MM-DD'),'']));
          _appendRow(getSpreadsheet().getSheetByName('assignments'), ['','',uuid,newvalues['assignedPublisher'],moment(date).format('YYYY-MM-DD'),'']);
        }
        else {
           if (assigns[assigns.length -1][3] != newvalues['assignedPublisher']){
             if (assigns[assigns.length -1][5] == ''){
                console.info("update :" + JSON.stringify([assigns[assigns.length -1][0],'',newvalues['uuid'],newvalues['assignedPublisher'],moment(date).format('YYYY-MM-DD'),'']));
                _updateRow(getSpreadsheet().getSheetByName('assignments'), [assigns[assigns.length -1][0],assigns[assigns.length -1][1],assigns[assigns.length -1][2],assigns[assigns.length -1][3],assigns[assigns.length -1][4],moment(date).format('YYYY-MM-DD')]);
             }
             if (newvalues['assignedPublisher'] != ''){
               console.info("append :" + JSON.stringify(['','',uuid,newvalues['assignedPublisher'],moment(date).format('YYYY-MM-DD'),'']));
               _appendRow(getSpreadsheet().getSheetByName('assignments'), ['','',uuid,newvalues['assignedPublisher'],moment(date).format('YYYY-MM-DD'),'']);
             }
            
           }
        }
      }
    }
    return findRow(s.getName(), values[0]);

}

function _createObject(s,uuid, newvalues) {
    var sheetName = s.getName();
    var columnNames = getColumnNames(sheetName);
    console.info(JSON.stringify(uuid));
    var values = [];
    console.info("current:" +JSON.stringify(values));
    console.info("new:" +JSON.stringify(newvalues));
    _.each(columnNames[0], function(c, index) {  
        console.info(JSON.stringify(c));
        if (c === '_id') {
            values[index] = newvalues['uuid'];
        }
        else{
          console.info("create:" + newvalues[c]);
          if(columnNames[1][index]['type'] == 'date'){
            values[index] = moment(newvalues[c]).format('YYYY-MM-DD');
          }
          else {
            values[index] = typeof newvalues[c] === undefined ? '' : newvalues[c];
          }
        }
    });

    // The append row method doesn't detect the validations at first, so appending a row with invalid data is possible.
    // That's why this is necessary to catch errors right away. Not the most elegant way, think about alternatives.
    try {
        console.info(JSON.stringify(values));
        var result = s.getRange(_getLastRowWithData(s) + 1, 1, 1, s.getLastColumn()).setValues([values]);
        SpreadsheetApp.flush();

    } catch (e) {
        deleteRow({'sheetName': s.getName(), 'rowId': values[0]});
        throw e;
    }
    return findRow(s.getName(), values[0]);
}

function getTitle(row) {

    return row[auditColumns] + ' - ' + row[auditColumns + 1] + ' (' + row[0] + ')';

}


function getRelationships(atts) {

    var sheetNames = getSheetList();

    var relationships = {};
    _.each(sheetNames, function(name) {
        var rows = getAllRows(name);

        for(var i in rows[0]) {

            if(JSON.parse(rows[1][i])['options'] === atts.sheetName) {

                relationships[name] = _.filter(rows, function(row) { return row[i] === atts.rowId; });
                break;

            }

        }

    });

    return relationships;

}

// Generating the html on the backend is a looot faster than doing the loop in the template itself.
function createOptionsObject(options, value) {

    if(_.isArray(options)) {

        var options =  _.object(options, options);

    } else if(_.isString(options)) {

        var rows = getAllRows(options);
        rows = getDataOnly(rows);

      
        var options =   _.object(
                        _.map(rows, function(row) { return getTitle(row); }),
                        _.map(rows, function(row) { return row[0]; }));

    } else {

        var options = options;

    }


    var htmlOptions = '';
    for(var key in options) {
        var selected = options[key] === value ? 'selected' : '';
        htmlOptions += '<option value="' + options[key] + '"' + selected + '>' + key + '</option>';
    }

    return htmlOptions;

}
