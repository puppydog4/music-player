package service

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"sort"

	"github.com/joho/godotenv"
	"github.com/puppydog4/music-player/internal/model"
)

// create a new service for Prowlarr
type ProwlarrService struct {
	client *http.Client
}

// NewProwlarrService creates a new ProwlarrService with an HTTP client
func NewProwlarrService() *ProwlarrService {
	return &ProwlarrService{
		client: &http.Client{},
	}
}

func (s *ProwlarrService) SearchProwlarr(query string) ([]model.ProwlarrSearchResult, error) {
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
	q.Set("categories", "3000")
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
	var results []model.ProwlarrSearchResult
	var filteredResults []model.ProwlarrSearchResult
	err = json.Unmarshal(bodyBytes, &results)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal Prowlarr search response: %w (body: %s)", err, string(bodyBytes))
	}

	for _, result := range results {
		if result.Seeders > 0 {
			filteredResults = append(filteredResults, result)
		}
	}

	// sort results by result.Seeders in descending order
	sort.Slice(filteredResults, func(i, j int) bool {
		return filteredResults[i].Seeders > filteredResults[j].Seeders
	})
	return filteredResults, nil
}
