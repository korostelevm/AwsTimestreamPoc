let getAllRows = async function (query, nextToken) { 
    const params = { 
        QueryString: query 
    }; 
  
    if (nextToken) { 
        params.NextToken = nextToken; 
    } 
  
    return await queryClient.query(params).promise() 
        .then( 
            (response) => { 
                // parseQueryResult(response); 
                // parseQueryResult(response); 
                
                // console.log(JSON.stringify(response,null,2))
                if (response.NextToken) { 
                    return getAllRows(query, response.NextToken); 
                } else{
                    return response
                }
            }, 
            (err) => { 
                console.error("Error while querying:", err); 
            }); 
} 
  
async function tryQueryWithMultiplePages(limit) { 
    const queryWithLimits = SELECT_ALL_QUERY + " LIMIT " + limit; 
    console.log(`Running query with multiple pages: ${queryWithLimits}`); 
    await getAllRows(queryWithLimits, null) 
} 
function parseQueryResult(response) { 
    const columnInfo = response.ColumnInfo; 
    const rows = response.Rows; 
  
    console.log("Metadata: " + JSON.stringify(columnInfo)); 
    console.log("Data: "); 
  
    rows.forEach(function (row) { 
        console.log(parseRow(columnInfo, row)); 
    }); 
} 
  
function parseRow(columnInfo, row) { 
    const data = row.Data; 
    const rowOutput = []; 
  
    var i; 
    for ( i = 0; i < data.length; i++ ) { 
        info = columnInfo[i]; 
        datum = data[i]; 
        rowOutput.push(parseDatum(info, datum)); 
    } 
  
    return `{${rowOutput.join(", ")}}` 
} 
  
function parseDatum(info, datum) { 
    if (datum.NullValue != null && datum.NullValue === true) { 
        return `${info.Name}=NULL`; 
    } 
  
    const columnType = info.Type; 
  
    // If the column is of TimeSeries Type 
    if (columnType.TimeSeriesMeasureValueColumnInfo != null) { 
        return parseTimeSeries(info, datum); 
    } 
    // If the column is of Array Type 
    else if (columnType.ArrayColumnInfo != null) { 
        const arrayValues = datum.ArrayValue; 
        return `${info.Name}=${parseArray(info.Type.ArrayColumnInfo, arrayValues)}`; 
    } 
    // If the column is of Row Type 
    else if (columnType.RowColumnInfo != null) { 
        const rowColumnInfo = info.Type.RowColumnInfo; 
        const rowValues = datum.RowValue; 
        return parseRow(rowColumnInfo, rowValues); 
    } 
    // If the column is of Scalar Type 
    else { 
        return parseScalarType(info, datum); 
    } 
} 
  
function parseTimeSeries(info, datum) { 
    const timeSeriesOutput = []; 
    datum.TimeSeriesValue.forEach(function (dataPoint) { 
        timeSeriesOutput.push(`{time=${dataPoint.Time}, value=${parseDatum(info.Type.TimeSeriesMeasureValueColumnInfo, dataPoint.Value)}}`) 
    }); 
  
    return `[${timeSeriesOutput.join(", ")}]` 
} 
  
function parseScalarType(info, datum) { 
    return parseColumnName(info) + datum.ScalarValue; 
} 
  
function parseColumnName(info) { 
    return info.Name == null ? "" : `${info.Name}=`; 
} 
  
function parseArray(arrayColumnInfo, arrayValues) { 
    const arrayOutput = []; 
    arrayValues.forEach(function (datum) { 
        arrayOutput.push(parseDatum(arrayColumnInfo, datum)); 
    }); 
    return `[${arrayOutput.join(", ")}]` 
}

module.exports = {
    getAllRows
}