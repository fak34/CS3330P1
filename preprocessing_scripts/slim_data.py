# Run this script from this directory with Python 3 after downloading raw files to raw_data/
# Inspired in part by http://stackoverflow.com/questions/7588934/deleting-columns-in-a-csv-with-python

import csv
with open("../raw_data/flights.csv","r") as source:
    rdr= csv.reader(source )
    with open("../temp/flights_slimmed.csv","w") as result:
        wtr= csv.writer( result )
        for r in rdr:
            wtr.writerow( (r[4], r[7], r[8], r[22], r[23], r[24]) )