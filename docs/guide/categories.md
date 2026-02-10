# Categories

PKP defines category-specific schemas to ensure products can be meaningfully compared.

## Available Categories

| Category | Description | Min Completeness |
|----------|-------------|------------------|
| `celulares/smartphones` | Mobile phones | 70% |
| `notebooks` | Laptops and notebooks | 70% |
| `tvs` | Televisions | 60% |
| `eletrodomesticos` | Home appliances | 60% |
| `moda` | Fashion and clothing | 50% |
| `games` | Gaming consoles | 60% |
| `tablets` | Tablets and iPads | 70% |
| `audio` | Headphones, earbuds, speakers | 60% |
| `monitors` | Computer monitors | 65% |
| `smartwatches` | Smartwatches and wearables | 65% |
| `cameras` | Digital cameras | 65% |

## Smartphones

```yaml
specs:
  display_size: 6.7         # inches
  display_type: "AMOLED"    # AMOLED | LCD | OLED
  display_resolution: "2796x1290"
  refresh_rate_hz: 120
  processor: "Snapdragon 8 Gen 3"
  ram_gb: 12
  storage_gb: 256
  storage_expandable: false
  main_camera_mp: 200
  front_camera_mp: 12
  battery_mah: 5000
  fast_charging_w: 45
  wireless_charging: true
  water_resistance: "IP68"
  os: "Android 14"
  5g: true
  weight_g: 232
  colors: ["Black", "White"]
```

## Notebooks

```yaml
specs:
  screen_size: 15.6         # inches
  screen_resolution: "2880x1800"
  screen_type: "OLED"       # IPS | OLED | LCD
  refresh_rate_hz: 120
  processor: "Intel Core i7-13700H"
  processor_cores: 14
  ram_gb: 16
  ram_type: "DDR5"
  ram_expandable: true
  storage_gb: 512
  storage_type: "NVMe SSD"
  gpu: "NVIDIA RTX 4060"
  gpu_vram_gb: 8
  battery_wh: 72
  weight_kg: 1.8
  os: "Windows 11 Home"
  ports: ["USB-C", "HDMI", "USB-A"]
  wifi: "WiFi 6E"
  bluetooth: "5.3"
  webcam: "1080p"
  keyboard_backlit: true
  fingerprint_reader: true
```

## TVs

```yaml
specs:
  screen_size: 65           # inches
  resolution: "4K"          # 4K | 8K | Full HD
  panel_type: "OLED"        # OLED | QLED | LED | Mini-LED
  refresh_rate_hz: 120
  hdr: ["HDR10", "Dolby Vision"]
  smart_tv: true
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

## Appliances (eletrodomesticos)

```yaml
specs:
  capacity: "14 place settings"
  power_watts: 1800
  voltage: "220V"           # 110V | 220V | Bivolt
  energy_rating: "A"
  dimensions_cm: "60 x 85 x 60"
  weight_kg: 45
  color: "Stainless Steel"
  programs: 8
  noise_db: 45
  warranty_months: 12
```

## Fashion (moda)

```yaml
specs:
  material: "Cotton"
  composition: "95% cotton, 5% elastane"
  sizes: ["S", "M", "L", "XL"]
  colors: ["Black", "White", "Navy"]
  gender: "unisex"          # masculino | feminino | unisex
  style: "casual"
  care_instructions: "Machine wash cold"
  origin: "Brazil"
```

## Games

```yaml
specs:
  platform: "PlayStation 5"
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

## Tablets

```yaml
specs:
  display:
    size_inches: 12.9
    resolution: "2732x2048"
    technology: "Liquid Retina XDR"
    refresh_rate_hz: 120
    brightness_nits: 1600
    hdr: true
  processor:
    chipset: "Apple M2"
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
    base_gb: 256
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
  dimensions_mm: "280.6 x 214.9 x 6.4"
```

## Audio (Headphones)

```yaml
specs:
  type: "over-ear"              # over-ear | on-ear | in-ear | earbuds
  driver:
    size_mm: 40
    type: "dynamic"
    frequency_response: "20Hz-40kHz"
  anc:
    active: true
    transparency_mode: true
    levels: 3
  battery:
    hours_anc_on: 30
    hours_anc_off: 40
    fast_charge: true
    wireless_charging: true
  connectivity:
    bluetooth: "5.3"
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

```yaml
specs:
  panel:
    size_inches: 27
    resolution: "3840x2160"
    aspect_ratio: "16:9"
    panel_type: "IPS"
    refresh_rate_hz: 144
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
  use_case: "gaming"
```

## Smartwatches

```yaml
specs:
  display:
    size_mm: 45
    resolution: "396x484"
    technology: "LTPO OLED"
    always_on: true
    brightness_nits: 2000
    protection: "Sapphire Crystal"
  health:
    heart_rate: true
    blood_oxygen: true
    ecg: true
    temperature: true
    sleep_tracking: true
  fitness:
    gps: true
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
    case_size_mm: 45
    case_material: "Titanium"
    weight_grams: 51
  os: "watchOS 11"
  storage_gb: 64
  voice_assistant: "Siri"
  compatibility: ["iOS"]
```

## Cameras

```yaml
specs:
  type: "mirrorless"            # mirrorless | dslr | compact | action
  sensor:
    type: "Full-Frame"
    megapixels: 45
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
    max_resolution: "8K"
    max_fps_4k: 120
    max_fps_1080p: 240
    log_profile: true
    raw_video: true
    stabilization: "IBIS"
  viewfinder:
    type: "EVF"
    evf_resolution: 9.44
    evf_refresh_rate: 120
    lcd_size_inches: 3.2
    lcd_articulating: true
    lcd_touchscreen: true
  body:
    mount: "Sony E"
    weather_sealed: true
    weight_grams: 657
    battery_shots: 530
    dual_card_slots: true
    card_types: ["CFexpress Type A", "SD"]
  connectivity:
    wifi: true
    bluetooth: true
    usb: "USB-C 3.2"
    hdmi: "Micro HDMI"
  continuous_shooting_fps: 30
```
