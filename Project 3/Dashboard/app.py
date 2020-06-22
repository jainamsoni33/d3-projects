from flask import Flask, render_template, jsonify, request, redirect, url_for
from random import sample
from sklearn.decomposition import PCA

import numpy as np 
import json
import pandas as pd


returned_data = {}

df = pd.read_csv("static/data/merged_data.csv")
df = df.dropna()
df = df.drop("Unnamed: 0", axis=1)

df_HDI = pd.read_csv("static/data/human-development-index.csv")
df_HDI = df_HDI.fillna(0)

app = Flask(__name__)

@app.route("/", methods = ['POST', 'GET'])
def index():
    all_data = df.to_dict(orient = "records")
    returned_data["all_data"] = json.dumps(all_data)
    return render_template("index.html", returned_data = returned_data)


@app.route("/dropdown", methods = ['POST','GET'])
def filterByParams():
    year_arg = request.args.get('years')
    all_causes = request.args.getlist('causes')
    all_countries = request.args.getlist('countries')

    '''  Map  '''
    filtered_by_params_HDI = df_HDI[df_HDI['Year']== int(year_arg)]
    filtered_by_params_HDI['s_no'] = range(1, len(filtered_by_params_HDI)+1)
    returned_data['map_HDI'] = filtered_by_params_HDI.to_dict(orient = 'records')

    ''' PCA '''
    cols_to_select = all_causes
    filtered_by_params = df[df["Year"] == int(year_arg)]

    filtered_by_params_causes = filtered_by_params[all_causes]
    transformed_df_PCA = computePCA(filtered_by_params_causes)
    filtered_by_params_causes["Sum"] = filtered_by_params_causes[all_causes].sum(axis=1)

    cols_to_select.append("HDI")
    cols_to_select.append("Country")

    filtered_by_params_causes_HDI_country = filtered_by_params[cols_to_select]
    
    transformed_df_PCA.index = filtered_by_params_causes.index
    transformed_df_PCA["Sum"] = filtered_by_params_causes["Sum"]
    transformed_df_PCA.index = filtered_by_params_causes_HDI_country.index
    transformed_df_PCA[["Country", "HDI"]] = filtered_by_params_causes_HDI_country[["Country", "HDI"]]
    returned_data["pca_plot"] = transformed_df_PCA.to_dict(orient='records')


    ''' BarPlot '''
    filtered_by_params = df[df["Year"] == int(year_arg)]
    filtered_by_params = filtered_by_params[filtered_by_params["Country"].isin(all_countries)]
    filtered_by_params = filtered_by_params.drop(["HDI", "Year", "Code"], axis=1)
    returned_data["bar_plot"] = filtered_by_params.to_dict(orient='records')

    ''' Parallel '''
    returned_data["parallel"] = df.to_dict("records")

    return json.dumps(returned_data)

def computePCA(fil_df):
    pca_model = PCA(n_components=2)
    pca_model.fit(fil_df)
    fil_df_transformed = pd.DataFrame(pca_model.transform(fil_df), columns=["PC1", "PC2"])
    return fil_df_transformed

if __name__ == "__main__":
    app.run(debug=True)