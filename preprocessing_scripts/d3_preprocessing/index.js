var fs = require("fs");
var d3 = require("d3");

var N = 500;

fs.readFile("../../temp/flights_slimmed.csv", "utf8", function(err, csvString){
    if (err) {
        console.err("READ ERROR: " + err);
        return;
    }

    var rawData = d3.csvParse(csvString);
    var noDiverted = filterDiverted(rawData);

    fs.readFile("../../raw_data/airports.csv", "utf8", function(err, csvString){
        if (err) {
            console.err("READ ERROR: " + err);
            return;
        }

        var airports = d3.csvParse(csvString);

        augmentAirports(noDiverted, airports);

        fs.writeFile("../../airports.json", JSON.stringify(airports), function(err){
            if (err){
                console.err("WRITE ERROR: " + err);
            }
        });
    });

    var numCancelledDelayed = processUnordered(noDiverted, N);

    fs.writeFile("../../numCancelledDelayed.json", JSON.stringify(numCancelledDelayed), function(err){
        if (err){
            console.err("WRITE ERROR: " + err);
        }
    });

    fs.readFile("../../raw_data/airlines.csv", "utf8", function(err, csvString) {
        if (err) {
            console.err("READ ERROR: " + err);
            return;
        }
        var airlines = d3.csvParse(csvString);

        augmentAirlines(noDiverted, airlines);

        fs.writeFile("../../airlines.json", JSON.stringify(airlines), function(err){
            if (err){
                console.err("WRITE ERROR: " + err);
            }
        });
    });
});

function filterDiverted(rawData){
    return rawData.filter(function(flight){
        return !(Number(flight.DIVERTED));
    });
}

function mapUnordered(rawData){
    return d3.nest().key(function(d){
        return (d.ORIGIN_AIRPORT < d.DESTINATION_AIRPORT) ?
            d.ORIGIN_AIRPORT + "-" + d.DESTINATION_AIRPORT :
            d.DESTINATION_AIRPORT + "-" + d.ORIGIN_AIRPORT;
    }).map(rawData);
}

function sortByNumEntries(dataMap){
    return dataMap.entries().sort(function(a, b){
        return b.value.length - a.value.length;
    });
}

var EXCLUDE_LIST = ["HNL", "ANC", "SJU", "OGG", "ECP"];
function excludeSomeAirports(data){
    return data.filter(function(elem){
        var airportCodes=elem.key.split("-");
        return EXCLUDE_LIST.indexOf(airportCodes[0]) === -1 && EXCLUDE_LIST.indexOf(airportCodes[1]) === -1;
    });
}

function calculateNumCancelled(flights){
    return flights.filter(function(flight){
        return !!(Number(flight.CANCELLED));
    }).length;
}

function calculateNumDelayed(flights){
    return flights.filter(function(flight){
        return (Number(flight.ARRIVAL_DELAY)) >= 15;
    }).length;
}

function byAirline(flights){
    var mapByAirline = d3.nest().key(function(d){
        return d.AIRLINE;
    }).map(flights);

    var out = {};

    mapByAirline.entries().forEach(function(elem){
        out[elem.key] = {
            numCancelled: calculateNumCancelled(elem.value),
            numDelayed: calculateNumDelayed(elem.value),
            numFlights: elem.value.length
        };
    });

    return out;
}

function calculateNumCancelledDelayed(dataEntries){
    return dataEntries.map(function(elem){
        return {
            key: elem.key,
            numCancelled: calculateNumCancelled(elem.value),
            numDelayed: calculateNumDelayed(elem.value),
            numFlights: elem.value.length,
            byAirline: byAirline(elem.value)
        };
    });
}

function processUnordered(noDiverted, n){
    var dataMap = mapUnordered(noDiverted);
    var sorted = sortByNumEntries(dataMap);
    var excluded = excludeSomeAirports(sorted);

    var data = excluded.slice(0, n);

    var numCancelledDelayed = calculateNumCancelledDelayed(data);

    return numCancelledDelayed;
}

function augmentAirports(noDiverted, airports){
    var mapByOrigin = d3.nest().key(function(d){
        return d.ORIGIN_AIRPORT;
    }).map(noDiverted);

    var mapByDestination = d3.nest().key(function(d){
        return d.DESTINATION_AIRPORT;
    }).map(noDiverted);

    airports.forEach(function(airport){
        airport.NUM_FLIGHTS_LEAVING = mapByOrigin.get(airport.IATA_CODE).length;
        airport.NUM_FLIGHTS_ARRIVING = mapByDestination.get(airport.IATA_CODE).length;
    });
}

function augmentAirlines(noDiverted, airlines){
    var mapByAirline = d3.nest().key(function(d){
        return d.AIRLINE;
    }).map(noDiverted);

    airlines.forEach(function(airline){
        airline.NUM_FLIGHTS = mapByAirline.get(airline.IATA_CODE).length;
    })
}
