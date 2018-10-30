function getColumnNames(sheetName) {

    var s = getSpreadsheet().getSheetByName(sheetName);

    var columnNames = s.getRange(1, 1, titleRows, s.getLastColumn()).getValues();

    if(columnNames[0][0] !== '_id') {
        setAuditColumns(s);
    }

    columnNames[1] = _.map(columnNames[1], function(cell) {

        try {
            return JSON.parse(cell);
        } catch(err) {
            throw 'It seems like you have some badly formatted JSON in your sheet.' +
                  'These are some examples of well formatted settings:' +
                  '{"type": "text", "label": "First Name"}, ' +
                  '\n{"type": "select", "options": ["Option 1", "Option 2", "Option 3"]}. ' +
                  'Please review all your columns and refreh this page.';
        }


    })

    return columnNames;

}


function getAllRows(sheetName) {

    var s = getSpreadsheet().getSheetByName(sheetName);

    var rows = _getFullDataRange(s).getValues();

    return rows;

}


function getAllRowsJSON(sheetName) {

    return JSON.stringify(getAllRows(sheetName));

}

function getAllRowsJSONObject(sheetName) {
    var s = getSpreadsheet().getSheetByName(sheetName);
    var columnNames = s.getRange(1, 1, titleRows, s.getLastColumn()).getValues();

    var rows = getDataOnly(getAllRows(sheetName));
    var jsonrows = new Array();
    for(var i in rows) {
      var jsonData = {};
      for(var c = 0; c < rows[i].length; c++) {
         var value = _.isDate(rows[i][c]) ? moment(rows[i][c]).format(dateFormat) : rows[i][c];
         jsonData[columnNames[0][c]] = value;
      }
      jsonrows.push(jsonData);
    }
    return jsonrows;

}

function getAllEntitiesJSONObject() {
    var sheetList = getSheetList();
    
    var allentities = {};
    
    for(var n in sheetList) {
      var s = getSpreadsheet().getSheetByName(sheetList[n]);
      var columnNames = s.getRange(1, 1, titleRows, s.getLastColumn()).getValues();
  
      var rows = getDataOnly(getAllRows(sheetList[n]));
      var jsonrows = new Array();
      for(var i in rows) {
        var jsonData = {};
        for(var c = 0; c < rows[i].length; c++) {
           var value = _.isDate(rows[i][c]) ? moment(rows[i][c]).format(dateFormat) : rows[i][c];
           jsonData[columnNames[0][c]] = value;
        }
        jsonrows.push(jsonData);
      }
      allentities[s.getName()] = jsonrows;    
    }
    return allentities;
    

}

function getOneRowJSONObject(sheetName, rownum) {
    var s = getSpreadsheet().getSheetByName(sheetName);
    var columnNames = s.getRange(1, 1, titleRows, s.getLastColumn()).getValues();

    var rows = getDataOnly(getAllRows(sheetName));
    
    var jsonData = {};
    for(var c = 0; c < rows[rownum].length; c++) {
      var value = _.isDate(rows[rownum][c]) ? moment(rows[rownum][c]).format(dateFormat) : rows[rownum][c];
      jsonData[columnNames[0][c]] = value;
    }
    return jsonData;
}

function setAuditColumns(s) {

    var numRows = _getLastRowWithData(s);

    s.insertColumnBefore(1);
    s.getRange(1, 1).setValue('_id');
    s.getRange(2, 1).setValue('{"type": "hidden"}');

    if(numRows > titleRows) {
        var ids = _.map(_.range(1, numRows - 1), function(num) { return [num]; });
        s.getRange(1 + titleRows, 1, numRows - titleRows).setValues(ids);
    }

    s.insertColumnAfter(1);
    s.getRange(1, 2).setValue('_created_by');
    s.getRange(2, 2).setValue('{"type": "hidden"}');

}


// Generating the html on the backend is a looot faster than doing the loop in the template itself.
function getHtmlRows(sheetName) {

    var rows = getDataOnly(getAllRows(sheetName));

    var htmlRows = '';

    var perms = getPermissions();
    var view = true; 
  if (perms) { 
    var sheetPerms = perms['sheets'][sheetName];
    view = sheetPerms.indexOf('view') > -1 || sheetPerms.indexOf('all') > -1;
    var view_self = perms['sheets'][sheetName].indexOf('view_self') > -1;
  }
    if(view || view_self) {
        for(var i in rows) {

          // if view_self only show rows that are created by current user
          if(!view && rows[i][1] !== Session.getActiveUser().getEmail()) continue;

            var htmlRow = '<tr>';

            for(var c = auditColumns; c < rows[i].length; c++) {
                var value = _.isDate(rows[i][c]) ? moment(rows[i][c]).format(dateFormat) : rows[i][c];
                htmlRow +=  '<td>' +
                                '<a class="trigger-action"' +
                                   'href="#"' +
                                   'data-sheet-name="' + sheetName + '"' +
                                   'data-row-id="' + rows[i][0] + '"' +
                                   'data-template="part_single_row">' +
                                   value +
                                '</a>' +
                            '</td>';
            }

            htmlRow += '</tr>';

            htmlRows += htmlRow;
        }
    }

    return htmlRows;

}


function getFormFields(sheetName, rowId) {

    var s = getSpreadsheet().getSheetByName(sheetName);

    var columnNames = getColumnNames(sheetName);
    var row = findRow(sheetName, rowId);

    var fields = {};
    for (var i in columnNames[0]) {

        var options = columnNames[1][i];
        options['id'] = options['id'] || columnNames[0][i];
        options['value'] = row ? row[i] : options['value'] ? options['value'] : '';

        fields[columnNames[0][i]] = options;

    };

    return fields;

}


function findRow(sheetName, rowId) {

    var s = getSpreadsheet().getSheetByName(sheetName);

    var rowPosition = rowId ? getRowPosition(s, rowId) : -1;
    var row = rowPosition > -1 ? s.getRange(rowPosition, 1, 1, s.getLastColumn()).getValues()[0] : false;

    if(row) {
        var formulas = s.getRange(rowPosition, 1, 1, s.getLastColumn()).getFormulas()[0];

        for(var i = 0; i < formulas.length; i++) {
            if(formulas[i] !== '') {
                row[i] = formulas[i];
            }
        }
    }

    return row;

}

function selectRowsWhere(sheetName, column, value) {

    var s = getSpreadsheet().getSheetByName(sheetName);
    var columnNames = getColumnNames(sheetName);
    var colIndex = 0;
    console.info("selectRowsWhere -> columnNames" + columnNames);
    for (var i in columnNames[0]) {
      if (columnNames[0][i] == column)
      {
        console.info("selectRowsWhere -> colIndex:" + i);
        colIndex = i;
      }
    }
    var list = _getFullDataRange(s, 1).getValues();
    var data = getDataOnly(list);
    var returndata= [];
    for(var i = 0; i < data.length; i++) {
      console.info("selectRowsWhere -> data[i]: " + data[i]);
      console.info("selectRowsWhere -> data[i][colIndex]: " + data[i][colIndex]);
      if (data[i][colIndex] == value){
        returndata.push(data[i]);
      }
    }
    return returndata;
}

function login(user, password) {

    var s = getSpreadsheet().getSheetByName('user');

    var userList = _getFullDataRange(s, 2).getValues();
    var userdata = getDataOnly(userList);
    for(var i = 0; i < userdata.length; i++) {
      
      if (userdata[i][2] != '' && userdata[i][2] == user && userdata[i][3] == password){
        var response = getOneRowJSONObject('user',i);
        response['version'] = version;
        return response;
      }
    }
    
    return {'error':'User not found', 'version' : version};

}


function _getFullDataRange(s, fromCol, numCols) {

    var fromCol = fromCol || 1;
    var numCols = numCols || s.getLastColumn();

    return s.getRange(1, fromCol, _getLastRowWithData(s), numCols);

}


function getDataOnly(rows) {

    var data = rows.slice(titleRows);

    return data;

}


// Needed because if there are array formulas in sheet getLastRow() won't work and simply return the last row present in sheet
function _getLastRowWithData(s) {
    var data = s.getRange('A1:A').getValues();

    for(var i = 0; i < data.length; i++) {
        if(data[i][0] === '') {
            break;
        }
    }

    return i;
}


function getUsers(sheetName) {

    var s = getSpreadsheet().getSheetByName(sheetName);

    var userList = _getFullDataRange(s, 2, 1).getValues();
    userList = _.flatten(userList);

    return getDataOnly(userList);

}
