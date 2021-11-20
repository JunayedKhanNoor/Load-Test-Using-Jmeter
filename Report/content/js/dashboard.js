/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 0.0, "KoPercent": 100.0};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.0, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.0, 500, 1500, "HomePage"], "isController": false}, {"data": [0.0, 500, 1500, "ArchivesPage"], "isController": false}, {"data": [0.0, 500, 1500, "AboutPage"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 60, 60, 100.0, 37161.716666666645, 528, 68080, 47205.0, 62907.1, 65048.35, 68080.0, 0.3517741141155226, 11.363225689843695, 0.11473882237752399], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["HomePage", 20, 20, 100.0, 44775.99999999999, 1195, 68080, 45969.0, 62316.6, 67792.59999999999, 68080.0, 0.28568571714257146, 12.17307119734455, 0.031525865270615794], "isController": false}, {"data": ["ArchivesPage", 20, 20, 100.0, 33983.700000000004, 1075, 63188, 50101.0, 61023.9, 63079.95, 63188.0, 0.12580990123922753, 4.195268761401523, 0.054796109328804174], "isController": false}, {"data": ["AboutPage", 20, 20, 100.0, 32725.45, 528, 65985, 44711.5, 65029.700000000004, 65939.1, 65985.0, 0.16083764244183707, 3.369831331574842, 0.0695811285173182], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["The operation lasted too long: It took 56,878 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 62,332 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 56,991 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 53,843 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 68,080 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 60,996 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 47,815 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 54,689 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 49,480 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 41,757 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 62,971 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 50,922 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 53,982 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 49,166 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 49,714 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 52,322 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 45,343 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 57,598 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 55,749 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 48,790 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 65,985 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 38,811 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 63,188 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 46,595 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 49,280 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 51,275 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 44,005 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 39,841 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 65,067 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 61,027 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 43,315 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 47,854 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 64,694 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 60,917 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 42,890 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 39,951 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["500/Internal Server Error", 18, 30.0, 30.0], "isController": false}, {"data": ["The operation lasted too long: It took 40,212 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 45,418 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 57,970 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 40,316 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 62,178 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 59,962 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, 1.6666666666666667, 1.6666666666666667], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 60, 60, "500/Internal Server Error", 18, "The operation lasted too long: It took 56,878 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, "The operation lasted too long: It took 62,332 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, "The operation lasted too long: It took 56,991 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, "The operation lasted too long: It took 53,843 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": ["HomePage", 20, 20, "500/Internal Server Error", 2, "The operation lasted too long: It took 62,332 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, "The operation lasted too long: It took 68,080 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, "The operation lasted too long: It took 47,815 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, "The operation lasted too long: It took 39,841 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1], "isController": false}, {"data": ["ArchivesPage", 20, 20, "500/Internal Server Error", 8, "The operation lasted too long: It took 49,280 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, "The operation lasted too long: It took 56,878 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, "The operation lasted too long: It took 56,991 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, "The operation lasted too long: It took 53,843 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1], "isController": false}, {"data": ["AboutPage", 20, 20, "500/Internal Server Error", 8, "The operation lasted too long: It took 51,275 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, "The operation lasted too long: It took 44,005 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, "The operation lasted too long: It took 65,067 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1, "The operation lasted too long: It took 49,480 milliseconds, but should not have lasted longer than 10,000 milliseconds.", 1], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
