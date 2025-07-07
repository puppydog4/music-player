package service

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"time"

	"github.com/joho/godotenv"
)

type ProwlarSearchRequest struct {
	Query      string `json:"query"`
	Categories []int  `json:"categories,omitempty"`
}

// ProwlarrCategory represents a category object within the search result.
type ProwlarrCategory struct {
	ID            int                `json:"id"`
	Name          string             `json:"name"`
	SubCategories []ProwlarrCategory `json:"subCategories"`
}

// ProwlarrSearchResult represents a single item returned by Prowlarr's search API.
type ProwlarrSearchResult struct {
	ID               int                `json:"id"`
	GUID             string             `json:"guid"`
	Age              int                `json:"age"` // Days
	AgeHours         float64            `json:"ageHours"`
	AgeMinutes       float64            `json:"ageMinutes"`
	Size             int64              `json:"size"` // Size in bytes
	Files            int                `json:"files"`
	Grabs            int                `json:"grabs"`
	IndexerID        int                `json:"indexerId"`
	Indexer          string             `json:"indexer"`
	SubGroup         string             `json:"subGroup"`
	ReleaseHash      string             `json:"releaseHash"`
	Title            string             `json:"title"`
	SortTitle        string             `json:"sortTitle"`
	ImdbID           int                `json:"imdbId"`   // Assuming int, could be string if "tt12345"
	TmdbID           int                `json:"tmdbId"`   // Assuming int
	TvdbID           int                `json:"tvdbId"`   // Assuming int
	TvMazeID         int                `json:"tvMazeId"` // Assuming int
	PublishDate      time.Time          `json:"publishDate"`
	CommentURL       string             `json:"commentUrl"`
	DownloadURL      string             `json:"downloadUrl"`
	InfoURL          string             `json:"infoUrl"`
	PosterURL        string             `json:"posterUrl"`
	IndexerFlags     []string           `json:"indexerFlags"`
	Categories       []ProwlarrCategory `json:"categories"`
	MagnetURL        string             `json:"magnetUrl"`
	InfoHash         string             `json:"infoHash"`
	Seeders          int                `json:"seeders"`
	Leechers         int                `json:"leechers"`
	Protocol         string             `json:"protocol"` // "unknown", "torrent", "usenet"
	FileName         string             `json:"fileName"`
	DownloadClientID int                `json:"downloadClientId"`
}

func SearchProwlarr(query string, categories []int) ([]ProwlarrSearchResult, error) {
	// Construct the request payload
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env")
	}

	baseURL := os.Getenv("PROWLARR_URL") + "/api/v1/search"
	u, err := url.Parse(baseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse Prowlarr URL: %w", err)
	}
	q := u.Query()
	q.Set("query", query)
	q.Set("apiKey", os.Getenv("PROWLARR_API_KEY"))
	q.Set("type", "search")
	for _, category := range categories {
		q.Add("categories", fmt.Sprint(category))
	}
	u.RawQuery = q.Encode()

	resp, err := http.Get(u.String())
	if err != nil {
		return nil, fmt.Errorf("failed to create Prowlarr search request: %w", err)
	}

	// Read the response body
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read Prowlarr response body: %w", err)
	}

	defer resp.Body.Close()
	// Check HTTP status code
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("prowlarr API returned non-OK status: %s (body: %s)", resp.Status, string(bodyBytes))
	}

	// Unmarshal the JSON response into our results slice
	var results []ProwlarrSearchResult
	var filteredResults []ProwlarrSearchResult
	err = json.Unmarshal(bodyBytes, &results)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal Prowlarr search response: %w (body: %s)", err, string(bodyBytes))
	}

	for _, result := range results {
		if result.Seeders >= 10 {
			filteredResults = append(filteredResults, result)
		}
	}
	return filteredResults, nil
}
