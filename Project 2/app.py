from flask import Flask, render_template, jsonify, request, redirect, url_for
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from random import sample
from sklearn.preprocessing import MinMaxScaler

import matplotlib.pyplot as plt
import numpy as np 
import json
import pandas as pd

app = Flask(__name__)

# Global variables initialization
data_df = pd.read_csv("data/encoded_data.csv")
print("Whole dataset loaded into RAM")

records = {}

records["whole_dataset"] = []
records["stratified_sample"] = []
records["random_sample"] = []

records["data_loaded"] = False
records["cumulative_pca_variance_ratio"] = {}
records["intrinsic_dimensionality"] = {}

saved_pca = {}

task3 = {}
task3["top_2_pca"] = {}
task3["top_3_loaded_attributes"] = {}
task3["dataset"] = {}
task3["mds"] = {}


@app.route('/', methods = ["GET"])
def index():
    return render_template("index.html")


@app.route('/api/generate_data', methods = ["POST"])
def generate_data():

    global records
    
    scaler = MinMaxScaler()

    if not records["data_loaded"]:

        records["data_loaded"] = True

        """
        Stratified sampling code
        """
        print("First stratified call")

        optimal_k = 7

        kmeanModel = KMeans(n_clusters=optimal_k, random_state=11)
        kmeanModel.fit(data_df)

        clusters = {i:[] for i in range(optimal_k)}

        cluster_labels = kmeanModel.labels_

        for record, cluster_number in zip(data_df.iterrows(), cluster_labels):
            clusters[cluster_number].append(record[1])

        percent = 0.25
        stratified_sample = []

        for cluster_number in clusters.keys():
            stratified_sample.extend(sample(clusters[cluster_number], int(len(clusters[cluster_number]) * percent)))

        stratified_sample = pd.DataFrame(stratified_sample)

        task3["dataset"]["stratified_sample"] = stratified_sample

        pca = PCA(n_components=15)

        pca.fit(scaler.fit_transform(stratified_sample))

        saved_pca["stratified_sample"] = pca

        for feature, pca_variance, pca_variance_ratio in zip(list(range(pca.n_components_)), list(pca.explained_variance_),\
                                                                list(pca.explained_variance_ratio_)):
            records["stratified_sample"].append({"feature":feature, "pca_variance":pca_variance, \
                                                    "pca_variance_ratio":pca_variance_ratio})

        # makes it easier to get 75% data variance
        records["stratified_sample"] = sorted(records["stratified_sample"], key = lambda x: -x["pca_variance"])

        # calculating cumulative ratio and intrinsic dimensionality
        calculate_cum_sum("stratified_sample")
    
        """
        Random sampling code
        """
        print("First random call")
        random_sample = data_df.sample(frac=0.25, random_state=11)
        task3["dataset"]["random_sample"] = random_sample
        
        pca = PCA(n_components=15)

        pca.fit(scaler.fit_transform(random_sample))

        saved_pca["random_sample"] = pca

        for feature, pca_variance, pca_variance_ratio in zip(list(range(pca.n_components_)), list(pca.explained_variance_),\
                                                    list(pca.explained_variance_ratio_)):
            records["random_sample"].append({"feature":feature, "pca_variance":pca_variance, \
                                                    "pca_variance_ratio":pca_variance_ratio})

        # makes it easier to get 75% data variance
        records["random_sample"] = sorted(records["random_sample"], key = lambda x: -x["pca_variance"])

        # calculating cumulative ratio and intrinsic dimensionality
        calculate_cum_sum("random_sample")
    
        """
        PCA for the whole dataset
        """

        task3["dataset"]["whole_dataset"] = data_df

        pca = PCA(n_components=15)

        pca.fit(scaler.fit_transform(data_df))

        saved_pca["whole_dataset"] = pca

        for feature, pca_variance, pca_variance_ratio in zip(list(range(pca.n_components_)), list(pca.explained_variance_),\
                                                    list(pca.explained_variance_ratio_)):
            records["whole_dataset"].append({"feature":feature, "pca_variance":pca_variance, \
                                                    "pca_variance_ratio":pca_variance_ratio})

        # makes it easier to get 75% data variance
        records["whole_dataset"] = sorted(records["whole_dataset"], key = lambda x: -x["pca_variance"])

        # calculating cumulative ratio and intrinsic dimensionality
        calculate_cum_sum("whole_dataset")

    return json.dumps(records)

def calculate_cum_sum(data_type):
    records["cumulative_pca_variance_ratio"][data_type] = []

    for i in range(len(records[data_type])):
            records["cumulative_pca_variance_ratio"][data_type].append({"feature": records[data_type][i]["feature"], \
                                                                        "pca_variance_ratio": records[data_type][i]["pca_variance_ratio"]})
    
    records["intrinsic_dimensionality"][data_type] = 0
    for i in range(len(records[data_type])):
        records["cumulative_pca_variance_ratio"][data_type][i]["pca_variance_ratio"] += records["cumulative_pca_variance_ratio"][data_type][i - 1]["pca_variance_ratio"]
        
        if records["cumulative_pca_variance_ratio"][data_type][i]["pca_variance_ratio"] <= 0.75:
            records["intrinsic_dimensionality"][data_type] += 1


@app.route('/api/scatterplot_data', methods = ["POST"])
def generate_scatterplot_data():

    global task3, saved_pca

    # if data is not available, make it available
    if not records["data_loaded"]:
        generate_data()

    # we already have dataset loaded, in front-end use only those variables
    if not task3["top_3_loaded_attributes"]:
        get_loaded_attributes("whole_dataset")
        get_loaded_attributes("random_sample")
        get_loaded_attributes("stratified_sample")

    # get top 2 PCA loadings for all samples
    if not task3["top_2_pca"]:
        
        task3["top_2_pca"]["whole_dataset"] = saved_pca["whole_dataset"].transform(task3["dataset"]["whole_dataset"])[:, :2]
        task3["top_2_pca"]["random_sample"] = saved_pca["random_sample"].transform(task3["dataset"]["random_sample"])[:, :2]
        task3["top_2_pca"]["stratified_sample"] = saved_pca["stratified_sample"].transform(task3["dataset"]["stratified_sample"])[:, :2]

        task3["top_2_pca"]["whole_dataset"] = pd.DataFrame({'PCA_1': task3["top_2_pca"]["whole_dataset"][:, 0], 'PCA_2': task3["top_2_pca"]["whole_dataset"][:, 1]}).to_dict("records")
        task3["top_2_pca"]["random_sample"] = pd.DataFrame({'PCA_1': task3["top_2_pca"]["random_sample"][:, 0], 'PCA_2': task3["top_2_pca"]["random_sample"][:, 1]}).to_dict("records")
        task3["top_2_pca"]["stratified_sample"] = pd.DataFrame({'PCA_1': task3["top_2_pca"]["stratified_sample"][:, 0], 'PCA_2': task3["top_2_pca"]["stratified_sample"][:, 1]}).to_dict("records")

        task3["dataset"]["whole_dataset"] = task3["dataset"]["whole_dataset"].to_dict("records")
        task3["dataset"]["random_sample"] = task3["dataset"]["random_sample"].to_dict("records")
        task3["dataset"]["stratified_sample"] = task3["dataset"]["stratified_sample"].to_dict("records")

    """
    MDS
    Use pre-computed CSVs directly as execution takes time
    
    """
    if not task3["mds"]:
        task3["mds"]["euclidean"] = {}
        task3["mds"]["euclidean"]["whole_dataset"] = pd.read_csv("data/mds_euclidean_whole_data.csv").to_dict("records")
        task3["mds"]["euclidean"]["random_sample"] = pd.read_csv("data/mds_euclidean_random_data.csv").to_dict("records")
        task3["mds"]["euclidean"]["stratified_sample"] = pd.read_csv("data/mds_euclidean_stratified_data.csv").to_dict("records")

        task3["mds"]["correlation"] = {}
        task3["mds"]["correlation"]["whole_dataset"] = pd.read_csv("data/mds_correlation_whole_data.csv").to_dict("records")
        task3["mds"]["correlation"]["random_sample"] = pd.read_csv("data/mds_correlation_random_data.csv").to_dict("records")
        task3["mds"]["correlation"]["stratified_sample"] = pd.read_csv("data/mds_correlation_stratified_data.csv").to_dict("records")
        
    return json.dumps(task3)

def get_loaded_attributes(data_type):
    
    pca_principal_axes = []

    for i in range(records["intrinsic_dimensionality"][data_type]):
        pca_principal_axes.append(records[data_type][i]["feature"])
    
    # print(pca_principal_axes)

    pca = saved_pca[data_type]

    # rows represent the variables, columns represent number of pca_components (only principal axes)
    loadings = pca.components_[np.ix_(pca_principal_axes)].transpose()

    sum_of_square_values = np.square(loadings).sum(axis = 1)

    feature_value = []

    for squared_sum, feature in zip(sum_of_square_values, data_df.columns):
        feature_value.append({"variable": feature, "squared_value": squared_sum})

    feature_value.sort(key = lambda x: -x["squared_value"])

    variables = [value["variable"] for value in feature_value[:3]]

    # scaler = MinMaxScaler()
    
    task3["top_3_loaded_attributes"][data_type] = pd.DataFrame(data = task3["dataset"][data_type][variables], columns = variables).to_dict("records")


if __name__ == '__main__':
    app.run(debug=True)