package main

import (
	"flag"
	"log"
	"os"
	"time"

	"github.com/ajeetraina/genai-app-demo/pkg/llamacpp"
)

func main() {
	// Define command line flags
	baseURL := flag.String("baseURL", "", "Base URL for the llama.cpp API (default from env LLAMACPP_BASE_URL)")
	modelName := flag.String("model", "", "Model name for labeling metrics (default from env LLAMACPP_MODEL)")
	addr := flag.String("addr", "", "Address to expose metrics on (default from env LLAMACPP_EXPORTER_ADDR)")
	interval := flag.Duration("interval", 0, "Interval between metrics scrapes (default from env LLAMACPP_SCRAPE_INTERVAL)")
	timeout := flag.Duration("timeout", 0, "HTTP client timeout (default from env LLAMACPP_CLIENT_TIMEOUT)")
	
	flag.Parse()
	
	// Get default configuration
	config := llamacpp.DefaultConfig()
	
	// Override with command line flags if provided
	if *baseURL != "" {
		config.BaseURL = *baseURL
	}
	
	if *modelName != "" {
		config.ModelName = *modelName
	}
	
	if *addr != "" {
		config.ExporterAddr = *addr
	}
	
	if *interval != 0 {
		config.ScrapeInterval = *interval
	}
	
	if *timeout != 0 {
		config.ClientTimeout = *timeout
	}
	
	// Log configuration
	log.Printf("Starting llama.cpp exporter with configuration:")
	log.Printf("  Base URL:        %s", config.BaseURL)
	log.Printf("  Model Name:      %s", config.ModelName)
	log.Printf("  Exporter Addr:   %s", config.ExporterAddr)
	log.Printf("  Scrape Interval: %s", config.ScrapeInterval)
	log.Printf("  Client Timeout:  %s", config.ClientTimeout)
	
	// Create and start the monitor
	monitor := llamacpp.NewMonitor(config)
	
	if err := monitor.Start(); err != nil {
		log.Printf("Error starting monitor: %v", err)
		os.Exit(1)
	}
}