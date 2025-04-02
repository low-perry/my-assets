# Search API Documentation

## Endpoints Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/search` | GET | Standard search with query parameters |
| `/search` | POST | Advanced search with complex filters in request body |

## Base URL
```
https://live.luigisbox.com
```

## 1. Standard Search (GET)

### Endpoint
```
GET https://live.luigisbox.com/search
```

Use this endpoint for most search operations. The search endpoint is publicly available and requires no authentication.

### Required Parameters

| Parameter | Description |
|-----------|-------------|
| `q` | User input query. Optional if using filters only (`f[]` parameter). |
| `tracker_id` | Identifier of your site within Luigi's Box. Visible in the Luigi's Box app URLs when logged in. |

### Optional Parameters

| Parameter | Description | Default | Example |
|-----------|-------------|---------|---------|
| `f[]` | Filter using `key:value` syntax. Multiple filters for the same field use OR logic. | - | `f[]=categories:Gadgets` |
| `f_must[]` | Similar to `f[]` but multiple filters for the same attribute use AND logic. | - | `f_must[]=categories:jackets` |
| `size` | Number of hits to return. | 10 | `size=50` (max: 200) |
| `sort` | Specify ordering of results using `attr:{asc\|desc}` syntax. | - | `sort=created_at:desc` |
| `sort_type` | Sort specific types of results using `attr:{asc\|desc}` syntax. | - | `sort_item=price_amount:asc` |
| `quicksearch_types` | Comma-separated list of other content types to search for alongside the main type. | - | `quicksearch_types=category,brand` |
| `facets` | Comma-separated list of facets to include in response. | - | `facets=category,material:5` |
| `dynamic_facets_size` | Maximum number of dynamically identified facets to include. | 0 | `dynamic_facets_size=3` |
| `page` | Which page of results to return. | 1 | `page=2` |
| `from` | Offset equivalent (alternative to page). | - | `from=0` |
| `use_fixits` | Control use of fixit rules. | true | `use_fixits=false` |
| `prefer[]` | Soft filter using `key:value` syntax to prefer hits by certain criteria. | - | `prefer[]=category:Gadgets` |
| `hit_fields` | Comma-separated list of fields to include in results. | all fields | `hit_fields=image_link,price` |
| `remove_fields` | Comma-separated list of fields to omit from results. | - | `remove_fields=image_link,price` |
| `user_id` | User ID for personalization. | - | - |
| `client_id` | Set to client_id sent in analytics when storing logged-in user ID in user_id. | - | - |
| `ctx[]` | Drives model selection using `key:value` syntax. | - | `ctx[]=warehouse:berlin` |
| `qu` | Controls query understanding process. | 0 | `qu=1` |
| `non_collapsed_variants` | Used with Variant search to retrieve all variants. | false | `non_collapsed_variants=true` |

### Context Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `context[geo_location]` | Visitor's geographical coordinates (lat, lon). | `context[geo_location]=49.0448,18.5530` |
| `context[geo_location_field]` | Custom field with geo coordinates. | `context[geo_location_field]=my_field` |
| `context[availability_field]` | Field for item availability consideration. | `context[availability_field]=my_custom_field` |
| `context[availability_rank_field]` | Field for item availability rank consideration. | `context[availability_rank_field]=my_custom_field` |
| `context[boost_field]` | Field used for boosting results. | `context[boost_field]=my_custom_field` |
| `context[freshness_field]` | Field for item freshness consideration. | `context[freshness_field]=my_custom_field` |

### Example Request

```ruby
require 'faraday'
require 'faraday_middleware'
require 'json'

connection = Faraday.new(url: 'https://live.luigisbox.com') do |conn|
  conn.use FaradayMiddleware::Gzip
end

response = connection.get("/search?q=harry+potter&tracker_id=1234-5678")

if response.success?
  puts JSON.pretty_generate(JSON.parse(response.body))
else
  puts "Error, HTTP status #{response.status}"
  puts response.body
end
```

## 2. Advanced Search with Complex Filters (POST)

### Endpoint
```
POST https://live.luigisbox.com/search
```

Use this endpoint when you need to apply complex compound filters with nested conditions.

### Request Format
- All standard query parameters remain in the URL (same as GET endpoint)
- Complex filters are submitted as JSON in the request body

### Complex Filter JSON Structure
- Place filters under a top-level `filters` object
- Define type for which filter should be applied (e.g., `item` or `product`)
- Use nested combinations of `and`, `or`, and `not` operators
- Individual filters follow standard syntax (`key:value`) under the `filter` key

### Example Request

```
POST https://live.luigisbox.com/search?tracker_id=*your_tracker_id*&f[]=type:item&f[]=category:jackets&query=adidas
```

With payload:
```json
{
  "filters": {
    "item": {
      "and": [
        {
          "or": [
            {
              "or": [
                {"filter": "price_amount:1|3"},
                {"filter": "price_amount:9|"}
              ]
            },
            {
              "and": [
                {"filter": "category:foo"},
                {"filter": "price_amount:6"}
              ]
            }
          ]
        },
        {
          "not": [
            {"filter": "price_amount:2"}
          ]
        }
      ]
    }
  }
}
```

### Notes on Complex Filters
Unlike traditional filters, complex filters are always applied and facets cannot show values outside the scope defined by the filter.

## Response Format

Both endpoints return the same response structure.

### Top-Level Fields

| Field | Description |
|-------|-------------|
| `results` | Contains all information about requested results |
| `next_page` | Link used for pagination to second page of results |

### Results Fields

| Field | Description |
|-------|-------------|
| `query` | Requested query (q parameter) |
| `corrected_query` | Returned only if Luigi's Box altered the requested query |
| `total_hits` | Number of hits found for requested type |
| `hits` | List of results for requested type |
| `facets` | List of facets calculated for matched items |
| `filters` | List of filters used for matching results |
| `quicksearch_types` | List of results for all requested quicksearch_types |
| `suggested_facet` | (Optional) Most useful facet for current situation |
| `suggested_url` | (Optional) URL for redirect if recognized by LB algorithm |
| `offset` | Deprecated, please ignore |
| `campaigns` | (Optional) List of campaigns for the query |

### Sample Response

```json
{
  "results": {
    "total_hits": 223,
    "hits": [
      {
        "url": "http://www.e-shop.com/products/123456",
        "attributes": {
          "image_link": "http://www.e-shop.com/assets/imgs/products/123456.jpg",
          "description": "Description field from your product catalog",
          "categories": ["Gadgets", "Kids"],
          "categories_count": 2,
          "title": "<em>Product</em> X",
          "title.untouched": "Product X",
          "availability_rank_text": "true",
          "price": "5.52 EUR",
          "condition": "new"
        },
        "type": "item",
        "updated_at": "2017-11-23T00:00:00+00:00"
      },
      // Additional results...
    ],
    "facets": [
      // Facet data...
    ],
    "offset": "20",
    "campaigns": [
      // Campaign data...
    ]
  },
  "next_page": "https://live.luigisbox.com/search?q=harry+potter&tracker_id=1234-5678&page=2"
}
```

## Common Search Scenarios

### Filtering Search Results

Use the `f[]` and `f_must[]` parameters for filtering:

- Filters of the same type are applied with OR logic
- Filters of different types are applied with AND logic
- Use `f_must[]` to combine two filters of same type with AND logic

Example:
```
GET https://live.luigisbox.com/search?tracker_id=*your_tracker_id*&f[]=type:item&f_must[]=category:jackets&f_must[]=category:windproof&query=adidas
```

### Geographical Distance Filtering

To filter results based on geographical distance:
```
f[]=geo_range:|50km
```

Pattern: `lower_range|upper_range` where range matches `/\d+km/`. Either range can be omitted for an open interval.

### Filtering with Missing Values

To include items that have the required attribute missing, use the special value `value_missing`:
```
f[]=color:red&f[]=color:value_missing
```

## Integration Features

### Query Correction

Luigi's Box can automatically augment queries to avoid no-results or low-relevance results:

1. **Typo correction**: Fixes typos like "sheos" → "shoes"
   - Example: `<strike>sheos</strike> <b>shoes</b>`

2. **Partial term removal**: Removes terms causing no results
   - Example: `shoes <strike>whiskey</strike>`

3. **Code correction**: Attempts to match similar codes
   - Example: `6834a<strike>88asc</strike>`

The `corrected_query` field contains HTML representation of the augmented query.

### Query Rewrite

Query rewrite controls your search and autocomplete results:

- Set up query rewrites in Luigi's Box application
- Works automatically with search.js
- For API integration, you must adapt your code to incorporate query rewrite functionality

Each query rewrite has one search query it responds to (diacritics and case insensitive). You can:
- Choose to rewrite or keep the original query
- Define filters to apply to search requests
- Choose whether to inform the customer about the rewrite
- Define a message to show when applying query rewrite

```json
{
  "query_rewrite": {
    "id": 9,
    "original_query": "mini guitar",
    "admit_rewrite": true,
    "message": "We rewrote your entered query to another with better search results for you."
  }
}
```

### Banners

Search API response includes data related to banner campaigns set up in the application. See Banner campaigns documentation for details.

## Best Practices

### Filter for Main Type
Always request only the type you want to search by adding a type filter:
```
f[]=type:item
```

### Request All Types in a Single HTTP Request
Use `quicksearch_types` to get results for multiple types:
```
GET https://live.luigisbox.com/search?tracker_id=179075-204259&f[]=type:product&quicksearch_types=category,brand&q=ukulele
```

### Use Pagination
Request smaller result sets for better performance:
```
GET https://live.luigisbox.com/search?tracker_id=179075-204259&f[]=type:product&q=ukulele&size=30&page=2
```

### Avoid Default Explicit Sorting
Let Luigi's Box AI sort results by default unless specific ordering is needed.

### Use Dynamic Facets
Let AI choose suitable facets based on the query:
```
GET https://live.luigisbox.com/search?tracker_id=179075-204259&f[]=type:product&q=ukulele&facets=price_amount,category&dynamic_facets_size=3
```

### Optimize Data Loading
Improve performance by only requesting needed attributes:

- Include specific fields:
```
GET https://live.luigisbox.com/search?tracker_id=179075-204259&f[]=type:product&q=ukulele&hit_fields=image_link,price
```

- Exclude specific fields:
```
GET https://live.luigisbox.com/search?tracker_id=179075-204259&f[]=type:product&q=ukulele&remove_fields=image_link,price
```

- For best performance, combine both approaches:
```
GET https://live.luigisbox.com/search?tracker_id=179075-204259&f[]=type:product&q=ukulele&hit_fields=image_link,price&remove_fields=nested
```

## Request Headers

Consider sending the `Accept-Encoding` header with values for supported encoding methods (e.g., `gzip` or `br, gzip, deflate`) to make the API response considerably smaller and faster to transfer.
