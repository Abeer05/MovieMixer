from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np
from dotenv import load_dotenv
import os

app = Flask(__name__)
CORS(app)


@app.route('/recommend', methods=['POST'])
def process():
    global database
    data = request.get_json()
    database = data.get("database")
    movies = data.get("movies")
    result = movie_decider(database, movies)
    result = result[:5]
    return jsonify(result)


def movie_decider(database, movies):
    tfidf_vectorizer = TfidfVectorizer()
    # TF-IDF is used to convert the genre, director and actors of each movie into numerical vectors
    feature_columns = ["genre", "director", "actors"]
    feature_texts = [
        ", ".join([movie[column] for column in feature_columns]) for movie in database]
    feature_matrix = tfidf_vectorizer.fit_transform(feature_texts)
    # converting database movies
    # fit_transform --> method to convert movie genres to matrix
    # matrix --> TF-IDF values of each feature for each movie

    similarities = []
    for x in movies:
        vector = tfidf_vectorizer.transform(
            [", ".join([x[column] for column in feature_columns])])
        # converting user inputted movies

        cosine_sim = cosine_similarity(vector, feature_matrix)
        # returns similarity matrix
        # each row corresponds to one of the users movies
        # each column corresponds to a movie in the database
        similarities.append(cosine_sim)

    avg_similarity = np.mean(similarities, axis=0)
    # average of the similarity scores from both movies
    # axis = 0 --> calculated among the rows (got the average of the columns)

    recommended_movies_indices = avg_similarity.argsort()[0][::-1]
    recommended_movies = [database[i] for i in recommended_movies_indices]
    # rank the movies based on combined similarity score in descending order
    # argsort() --> returns sorted array indices - default is ascending order, so array is reversed for the higher scores to show first
    return recommended_movies


if __name__ == "__main__":
    app.run(debug=True)
