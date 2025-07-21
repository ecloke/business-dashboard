import csv
import json
from datetime import datetime

# File paths
input_csv_path = "initial_data.csv"
output_json_path = "src/data/initial_data.json"

# Read CSV and convert to JSON
with open(input_csv_path, mode='r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    data = []

    for row in reader:
        record = {
            "id": row.get("Record ID", "") or "",
            "firstName": row.get("First Name", "") or "",
            "lastName": row.get("Last Name", "") or "",
            "email": row.get("Email", "") or "",
            "phone": row.get("Phone Number", "") or "",
            "company": row.get("Company Name", "") or "",
            "industry": row.get("Your Industry", "") or "",
            "state": row.get("State/Region", "") or "",
            "createDate": "",
            "trafficSource": row.get("Latest Traffic Source", "") or "",
            "trafficSourceDetail": row.get("Latest Traffic Source Drill-Down 1", "") or "",
            "originalTrafficSource": row.get("Original Traffic Source", "") or "",
            "formType": row.get("Record source detail 1", "") or "",
            "isComplete": bool(row.get("Company Name", "")) and bool(row.get("Your Industry", "")),
            "recordSource": row.get("Record source", "") or "",
            "message": row.get("Message", "") or "",
            "leadStatus": row.get("Lead Status", "") or "",
            "formSubmissions": int(float(row.get("Number of Form Submissions", 0) or 0))

        }

        # Format Create Date
        raw_date = row.get("Create Date", "")
        try:
            parsed_date = datetime.strptime(raw_date, "%Y-%m-%d %H:%M")
            record["createDate"] = parsed_date.isoformat() + "Z"
        except:
            record["createDate"] = ""

        data.append(record)

# Write to JSON
with open(output_json_path, 'w', encoding='utf-8') as json_file:
    json.dump(data, json_file, indent=2)
    print(f"JSON saved to: {output_json_path}")
