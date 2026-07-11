# fl-geo.json — Datos geográficos de Florida

Dataset estático usado por el cuestionario (v2) para autocompletar condado/ciudad a partir del ZIP y para el fallback manual (dropdown de condados y ciudades).

## Fuente

- **ZIPs → condado/ciudad**: [GeoNames Postal Codes](http://download.geonames.org/export/zip/) — archivo `US.zip` (`US.txt`), filtrado a `admin1 = FL`. Descargado el **2026-07-11**.
- **Lista de 67 condados**: nombres oficiales de los condados de Florida (verificados 1:1 contra los `admin2` del dataset GeoNames tras normalización).
- **`cities_principales`**: las 25 municipalidades de Florida con mayor población según el **US Census Bureau** (Censo 2020 / estimaciones ACS 2023), curadas a mano con su condado.
- **`county_cities`**: por condado, las ciudades principales — primero las de `cities_principales` que pertenecen al condado, luego las ciudades USPS con más ZIPs en el dataset (proxy de tamaño), máximo 5 por condado.

## Licencia

GeoNames publica los datos de códigos postales bajo **Creative Commons Attribution 4.0 (CC BY 4.0)** — <https://creativecommons.org/licenses/by/4.0/>. Atribución: *"Postal code data © GeoNames (geonames.org), CC BY 4.0"*. Los datos de población del Census Bureau son de dominio público.

## Estructura

```json
{
  "counties": ["Alachua", "...67 nombres oficiales..."],
  "zips": {"33904": {"county": "Lee", "city": "Cape Coral"}, "...": {}},
  "cities_principales": [{"city": "Jacksonville", "county": "Duval"}, "...25..."],
  "county_cities": {"Lee": ["Cape Coral", "Fort Myers", "..."], "...67 condados...": []}
}
```

- **1,473 ZIPs** de Florida (incluye ZIPs de PO Box y únicos; los 67 condados tienen cobertura).
- JSON compacto (sin espacios), UTF-8, LF.

## Normalizaciones aplicadas

- Condados: `Saint Johns` → `St. Johns`, `Saint Lucie` → `St. Lucie`, `De Soto`/`Desoto` → `DeSoto`, sufijo ` County` eliminado si aparece.
- Ciudades: prefijo `Saint ` → `St. ` (ej. `Saint Petersburg` → `St. Petersburg`) para consistencia con `cities_principales`.

## Caveats

- Los nombres de ciudad en `zips` son los **USPS preferred last-line names** de GeoNames: municipios como Miramar, Davie o Sunrise no aparecen como ciudad de ningún ZIP (USPS los agrupa bajo Hollywood/Fort Lauderdale), pero sí están en `cities_principales` y `county_cities`.
- Hay alguna rareza heredada de la fuente (ej. un ZIP con nombre de lugar que cruza límite de condado); no se corrigió a mano para mantener trazabilidad con la fuente.

## Regenerar

Descargar `http://download.geonames.org/export/zip/US.zip`, filtrar líneas con columna 5 (`admin1 code`) = `FL`, aplicar las normalizaciones de arriba y volcar con `json.dump(..., separators=(",",":"), ensure_ascii=False)`.

Verificación mínima: `json.load` OK · `len(zips) >= 900` · `33904→Lee/Cape Coral` · `33139→Miami-Dade/Miami Beach` · `32801→Orange/Orlando` · `33602→Hillsborough/Tampa`.
