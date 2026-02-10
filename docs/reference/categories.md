# Category Schemas

PKP defines category-specific schemas to ensure products can be meaningfully compared.

## Overview

| Category | Description | Min Completeness |
|----------|-------------|------------------|
| `celulares/smartphones` | Mobile phones | 70% |
| `notebooks` | Laptops and notebooks | 70% |
| `tvs` | Televisions | 60% |
| `tablets` | Tablets and iPads | 70% |
| `audio` | Headphones, earbuds, speakers | 60% |
| `monitors` | Computer monitors | 65% |
| `smartwatches` | Smartwatches and wearables | 65% |
| `cameras` | Digital cameras | 65% |
| `games` | Gaming consoles | 60% |
| `eletrodomesticos` | Home appliances | 60% |
| `moda` | Fashion and clothing | 50% |
| `moveis` | Furniture | 55% |
| `brinquedos` | Toys | 50% |
| `livros` | Books | 60% |
| `beleza` | Beauty and cosmetics | 55% |

## Smartphones

**Category:** `celulares/smartphones`

```yaml
specs:
  # Display
  display_size: 6.7           # inches (required)
  display_type: "AMOLED"      # AMOLED | LCD | OLED
  display_resolution: "2796x1290"
  refresh_rate_hz: 120

  # Performance
  processor: "Snapdragon 8 Gen 3"  # (required)
  ram_gb: 12                  # (required)
  storage_gb: 256             # (required)
  storage_expandable: false

  # Camera
  main_camera_mp: 200         # (required)
  front_camera_mp: 12

  # Battery
  battery_mah: 5000           # (required)
  fast_charging_w: 45
  wireless_charging: true

  # Connectivity
  5g: true
  water_resistance: "IP68"
  os: "Android 14"

  # Physical
  weight_g: 232
  colors: ["Black", "White"]
```

## Notebooks

**Category:** `notebooks`

```yaml
specs:
  # Display
  screen_size: 15.6           # inches (required)
  screen_resolution: "2880x1800"
  screen_type: "OLED"         # IPS | OLED | LCD
  refresh_rate_hz: 120

  # Performance
  processor: "Intel Core i7-13700H"  # (required)
  processor_cores: 14
  ram_gb: 16                  # (required)
  ram_type: "DDR5"
  ram_expandable: true
  storage_gb: 512             # (required)
  storage_type: "NVMe SSD"

  # Graphics
  gpu: "NVIDIA RTX 4060"
  gpu_vram_gb: 8

  # Battery & Physical
  battery_wh: 72
  weight_kg: 1.8              # (required)

  # Features
  os: "Windows 11 Home"
  ports: ["USB-C", "HDMI", "USB-A"]
  wifi: "WiFi 6E"
  bluetooth: "5.3"
  webcam: "1080p"
  keyboard_backlit: true
  fingerprint_reader: true
```

## TVs

**Category:** `tvs`

```yaml
specs:
  screen_size: 65             # inches (required)
  resolution: "4K"            # 4K | 8K | Full HD (required)
  panel_type: "OLED"          # OLED | QLED | LED | Mini-LED (required)
  refresh_rate_hz: 120        # (required)
  hdr: ["HDR10", "Dolby Vision"]
  smart_tv: true              # (required)
  os: "webOS"
  hdmi_ports: 4
  hdmi_version: "2.1"
  speakers_watts: 40
  dimensions_cm: "145 x 83 x 5"
  weight_kg: 25
  wall_mountable: true
  gaming_mode: true
  vrr: true
```

## Tablets

**Category:** `tablets`

```yaml
specs:
  display:
    size_inches: 12.9         # (required)
    resolution: "2732x2048"
    technology: "Liquid Retina XDR"
    refresh_rate_hz: 120
    brightness_nits: 1600
    hdr: true
  processor:
    chipset: "Apple M2"       # (required)
    cores: 8
    gpu_cores: 10
  camera:
    rear_mp: 12
    front_mp: 12
    video_4k: true
  battery:
    capacity_mah: 10758
    hours_video: 10
    fast_charge: true
  storage:
    base_gb: 256              # (required)
    expandable: false
  connectivity:
    wifi: "WiFi 6E"
    bluetooth: "5.3"
    cellular: true
    usb: "USB-C Thunderbolt"
  accessories:
    stylus_support: true
    keyboard_support: true
  os: "iPadOS 17"
  weight_grams: 682
```

## Audio

**Category:** `audio`

```yaml
specs:
  type: "over-ear"            # over-ear | on-ear | in-ear | earbuds (required)
  driver:
    size_mm: 40               # (required)
    type: "dynamic"
    frequency_response: "20Hz-40kHz"
  anc:
    active: true
    transparency_mode: true
    levels: 3
  battery:
    hours_anc_on: 30          # (required)
    hours_anc_off: 40
    fast_charge: true
    wireless_charging: true
  connectivity:
    bluetooth: "5.3"          # (required)
    multipoint: true
    wired_option: true
    codecs: ["SBC", "AAC", "LDAC"]
  features:
    microphone: true
    voice_assistant: "Google Assistant"
    app_support: true
    touch_controls: true
  physical:
    weight_grams: 250
    foldable: true
    colors: ["Black", "Silver"]
```

## Monitors

**Category:** `monitors`

```yaml
specs:
  panel:
    size_inches: 27           # (required)
    resolution: "3840x2160"   # (required)
    aspect_ratio: "16:9"
    panel_type: "IPS"         # (required)
    refresh_rate_hz: 144      # (required)
    response_time_ms: 1
    brightness_nits: 400
    hdr: ["HDR400"]
    color_gamut:
      srgb: 100
      dci_p3: 95
    bit_depth: 10
  gaming:
    adaptive_sync: "G-Sync Compatible"
    vrr: true
    motion_blur_reduction: true
  connectivity:
    hdmi: 2
    hdmi_version: "2.1"
    displayport: 1
    usb_c: 1
    usb_c_power_delivery: 90
  ergonomics:
    height_adjust: true
    tilt: true
    swivel: true
    pivot: true
    vesa_mount: "100x100"
  use_case: "gaming"          # gaming | creative | office | general
```

## Smartwatches

**Category:** `smartwatches`

```yaml
specs:
  display:
    size_mm: 45               # (required)
    resolution: "396x484"
    technology: "LTPO OLED"
    always_on: true
    brightness_nits: 2000
    protection: "Sapphire Crystal"
  health:
    heart_rate: true          # (required)
    blood_oxygen: true
    ecg: true
    temperature: true
    sleep_tracking: true
  fitness:
    gps: true                 # (required)
    workout_modes: 100
    water_resistance_atm: 5
    swim_tracking: true
  battery:
    capacity_mah: 542
    days_typical: 2
    fast_charge: true
  connectivity:
    bluetooth: "5.3"
    wifi: true
    nfc: true
    lte: true
  physical:
    case_size_mm: 45          # (required)
    case_material: "Titanium"
    weight_grams: 51
  os: "watchOS 11"
  storage_gb: 64
  compatibility: ["iOS"]
```

## Cameras

**Category:** `cameras`

```yaml
specs:
  type: "mirrorless"          # mirrorless | dslr | compact | action (required)
  sensor:
    type: "Full-Frame"        # (required)
    megapixels: 45            # (required)
    size_mm: "35.9 x 23.9"
    iso_min: 64
    iso_max: 51200
    bsi: true
  autofocus:
    type: "Hybrid"
    points: 693
    coverage_percent: 93
    eye_af: true
    animal_af: true
    tracking: true
  video:
    max_resolution: "8K"      # (required)
    max_fps_4k: 120
    max_fps_1080p: 240
    log_profile: true
    raw_video: true
    stabilization: "IBIS"
  viewfinder:
    type: "EVF"
    evf_resolution: 9.44
    lcd_size_inches: 3.2
    lcd_articulating: true
    lcd_touchscreen: true
  body:
    mount: "Sony E"           # (required)
    weather_sealed: true
    weight_grams: 657
    battery_shots: 530
    dual_card_slots: true
  continuous_shooting_fps: 30
```

## Games (Consoles)

**Category:** `games`

```yaml
specs:
  platform: "PlayStation 5"   # (required)
  storage_gb: 1000
  resolution_max: "4K"
  fps_max: 120
  hdr: true
  ray_tracing: true
  backwards_compatible: true
  online_subscription: "PlayStation Plus"
  controllers_included: 1
  dimensions_cm: "39 x 10 x 26"
  weight_kg: 4.5
```

## Appliances (Eletrodomesticos)

**Category:** `eletrodomesticos`

```yaml
specs:
  type: "dishwasher"          # (required)
  capacity: "14 place settings"
  power_watts: 1800           # (required)
  voltage: "220V"             # 110V | 220V | Bivolt (required)
  energy_rating: "A"          # (required)
  dimensions_cm: "60 x 85 x 60"
  weight_kg: 45
  color: "Stainless Steel"
  programs: 8
  noise_db: 45
  warranty_months: 12
```

## Fashion (Moda)

**Category:** `moda`

```yaml
specs:
  type: "shoes"               # (required)
  material: "Synthetic"       # (required)
  composition: "Mesh upper, rubber sole"
  sizes: ["38", "39", "40", "41", "42"]  # (required)
  colors: ["Black", "White", "Red"]      # (required)
  gender: "unisex"            # masculino | feminino | unisex
  style: "athletic"
  care_instructions: "Wipe clean"
  origin: "Vietnam"
```

## Furniture (Moveis)

**Category:** `moveis`

```yaml
specs:
  type: "sofa"                # (required)
  dimensions:
    width_cm: 220             # (required)
    depth_cm: 95
    height_cm: 85
  material:
    primary: "Linen"          # (required)
    secondary: "Wood frame"
  capacity: "3 seats"
  color: "Gray"
  assembly_required: true     # (required)
  weight_kg: 65
  warranty_months: 24
```

## Toys (Brinquedos)

**Category:** `brinquedos`

```yaml
specs:
  type: "building_set"        # (required)
  age_range:
    min_years: 8              # (required)
    max_years: 99
  pieces: 2456
  theme: "Star Wars"
  dimensions_cm: "38 x 26 x 7"
  weight_kg: 2.1
  batteries_required: false
  safety:
    inmetro: true             # (required for Brazil)
    small_parts_warning: true
```

## Books (Livros)

**Category:** `livros`

```yaml
specs:
  type: "fiction"             # fiction | non-fiction | textbook | comic (required)
  author: "Author Name"       # (required)
  isbn: "978-3-16-148410-0"
  pages: 384
  language: "Portuguese"
  format:
    type: "paperback"         # hardcover | paperback | ebook | audiobook (required)
    dimensions_cm: "21 x 14 x 2.5"
  publication:
    publisher: "Publisher Name"  # (required)
    year: 2024
    edition: 1
  genre: ["Science Fiction", "Adventure"]
```

## Beauty (Beleza)

**Category:** `beleza`

```yaml
specs:
  type: "skincare"            # skincare | makeup | fragrance | haircare (required)
  subtype: "moisturizer"
  size:
    volume_ml: 50             # (required)
    weight_g: 60
  skin_type: ["dry", "normal", "combination"]
  ingredients:
    key: ["Hyaluronic Acid", "Vitamin C", "Niacinamide"]
    full_list: "Aqua, Glycerin, ..."
  compatibility:
    vegan: true
    cruelty_free: true
    fragrance_free: false
  certifications: ["Dermatologically tested"]
  shelf_life_months: 12
  origin: "France"
```

## Validation

When validating, PKP checks:
1. Required fields for the category
2. Field types and formats
3. Completeness score against minimum threshold

```bash
pkp validate ./products

# Output example:
# ✓ galaxy-s25-ultra.md (smartphones) - 85% complete
# ✗ generic-phone.md (smartphones) - 45% complete (min: 70%)
```
