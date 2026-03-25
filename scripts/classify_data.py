import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import LabelEncoder
import sys
import json
import os
from datetime import datetime
import random
import string
import subprocess

# Updated column names (removed BMI from medical conditions, kept BMI in physical info)
column_names = [
    'TEMPF', 'PULSE', 'RESPR', 'BPSYS', 'BPDIAS', 'POPCT', 'SCORE',
    'Pregnancies', 'Glucose', 'BloodPressure', 'Insulin',
    'DiabetesPedigreeFunction', 'Smoker', 'Stroke', 'Sex', 'Alcohol',
    'Height', 'Weight', 'Bmi', 'BmiClass', 'Name', 'Phone',
    'Address', 'Date of Birth', 'Email', 'Adhar Number',
    'emergencyPhone', 'emergencyEmail'
]

privacy_labels = [
    0, 0, 0, 0, 0, 0, 0,   # Public medical measurements
    1, 0, 0, 0, 1, 1, 1, 1, 1,   # Private health indicators
    0, 0, 0, 0,   # Physical measurements including BMI
    1, 1, 1, 1, 1, 1, 1, 1   # Personal and emergency contact information
]

def train_privacy_classifier(column_names, privacy_labels):
    """
    Train a Random Forest Classifier to predict column privacy
    """
    # Create training DataFrame
    df = pd.DataFrame({
        'column_name': column_names,
        'is_private': privacy_labels
    })
    
    # Prepare features and labels
    X = df['column_name'].values.reshape(-1, 1)
    y = df['is_private'].values
    
    # Label Encoder for column names
    encoder = LabelEncoder()
    X_encoded = encoder.fit_transform(X.ravel()).reshape(-1, 1)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X_encoded, y, test_size=0.2, random_state=42
    )
    
    # Train Random Forest Classifier
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)
    
    # Evaluate model
    y_pred = clf.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Privacy Classification Model Accuracy: {accuracy * 100:.2f}%")
    
    def predict_privacy(column_name):
        """
        Predict privacy status of a column with enforced rules.
        """
        # Updated rule-based classification for known columns
        always_private = [
            'Date of Birth', 'Name', 'Phone', 'Address', 'Email', 'Adhar Number',
            'emergencyPhone', 'emergencyEmail'
        ]
        always_public = [
            'TEMPF', 'PULSE', 'RESPR', 'BPSYS', 'BPDIAS', 'POPCT', 'SCORE',
            'Height', 'Weight', 'Bmi', 'BmiClass'
        ]
        
        if column_name in always_private:
            return "Private"
        elif column_name in always_public:
            return "Public"
        
        try:
            column_encoded = encoder.transform([column_name]).reshape(-1, 1)
            prediction = clf.predict(column_encoded)
            print(f"Debug: Column '{column_name}' encoded as {column_encoded.flatten()[0]}, Prediction: {prediction[0]}")
            return "Private" if prediction[0] == 1 else "Public"
        except ValueError as e:
            print(f"Error: {e}")
            return "Unknown"
    
    return predict_privacy, encoder, clf

def upload_to_ipfs(file_path):
    try:
        print(f"Debug: Uploading file to IPFS: {file_path}")
        
        # Use ipfs add command
        command = ['ipfs', 'add', '-Q', file_path]
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        stdout, stderr = process.communicate()
        
        if process.returncode == 0:
            cid = stdout.strip()
            print(f"Debug: IPFS upload successful. CID: {cid}")
            return cid
        else:
            print(f"Debug: IPFS upload failed. Error: {stderr}")
            raise Exception(f"IPFS upload failed: {stderr}")
            
    except Exception as e:
        print(f"Debug: Upload error details: {str(e)}")
        raise

def classify_healthcare_data(input_data, column_names):
    try:
        print("Debug: Starting classification...", file=sys.stderr)
        
        timestamp = pd.Timestamp.now().strftime('%Y%m%d_%H%M%S_%f')
        data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
        os.makedirs(data_dir, exist_ok=True)

        # Generate unique filenames
        private_file = os.path.join(data_dir, f'private_data_{timestamp}_{hash(str(input_data))}.csv')
        public_file = os.path.join(data_dir, f'public_data_{timestamp}_{hash(str(input_data))}.csv')

        # Create DataFrames and save files
        df = pd.DataFrame([input_data], columns=column_names)
        private_df = df[['Pregnancies', 'DiabetesPedigreeFunction', 'Smoker', 'Stroke', 
                        'Sex', 'Alcohol', 'Name', 'Phone', 'Address', 'Date of Birth', 
                        'Email', 'Adhar Number', 'emergencyPhone', 'emergencyEmail']]
        public_df = df[['TEMPF', 'PULSE', 'RESPR', 'BPSYS', 'BPDIAS', 'POPCT', 
                        'SCORE', 'Height', 'Weight', 'Bmi', 'BmiClass']]

        private_df.to_csv(private_file, index=False)
        public_df.to_csv(public_file, index=False)

        # Upload to IPFS
        private_result = upload_to_ipfs(private_file)
        if not private_result.get('success'):
            raise Exception(f"Private file upload failed: {private_result.get('error')}")

        public_result = upload_to_ipfs(public_file)
        if not public_result.get('success'):
            raise Exception(f"Public file upload failed: {public_result.get('error')}")

        result = {
            "success": True,
            "data": {
                "privateCID": private_result['cid']['cid'],
                "publicCID": public_result['cid']['cid'],
                "timestamp": timestamp
            }
        }
        
        print(json.dumps(result), flush=True)
        return result

    except Exception as e:
        print(f"Debug: Classification error: {str(e)}", file=sys.stderr)
        return {"success": False, "error": str(e)}

def main():
    try:
        print("Script started", file=sys.stderr)
        print("Parsing input data", file=sys.stderr)

        # Parse input data
        input_data = json.loads(sys.argv[1])
        print(f"Received data: {input_data}", file=sys.stderr)
        print(f"Processing input data...", file=sys.stderr)
        print(f"Data length: {len(input_data)}", file=sys.stderr)

        # Generate timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        rand_suffix = ''.join(random.choices(string.digits, k=19))
        
        # Define file paths
        private_file = os.path.join(os.path.dirname(__file__), '..', 'data', f'private_data_{timestamp}_{rand_suffix}.csv')
        public_file = os.path.join(os.path.dirname(__file__), '..', 'data', f'public_data_{timestamp}_{rand_suffix}.csv')

        # Create data directory if it doesn't exist
        os.makedirs(os.path.dirname(private_file), exist_ok=True)

        print("Debug: Starting classification...", file=sys.stderr)

        # Write files
        with open(private_file, 'w') as f_private, open(public_file, 'w') as f_public:
            # Write your CSV data here
            f_private.write("your,csv,headers\n")
            f_public.write("your,public,headers\n")
            # Write your data rows

        print(f"Debug: Created unique files:", file=sys.stderr)
        print(f"Private: {private_file}", file=sys.stderr)
        print(f"Public: {public_file}", file=sys.stderr)

        print("Debug: Files saved, attempting IPFS uploads...", file=sys.stderr)

        # Upload to IPFS
        print(f"Debug: Attempting IPFS upload for {private_file}", file=sys.stderr)
        private_cid = upload_to_ipfs(private_file)
        
        print(f"Debug: Attempting IPFS upload for {public_file}", file=sys.stderr)
        public_cid = upload_to_ipfs(public_file)

        # Create response
        response = {
            "success": True,
            "data": {
                "privateCID": private_cid,
                "publicCID": public_cid,
                "timestamp": timestamp
            }
        }

        # Print single JSON response
        print(json.dumps(response))
        return 0

    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
        return 1

if __name__ == "__main__":
    sys.exit(main())