
# Plan: Add Mapped Fields to Data Tables

## Problem Summary

The WordPress sync is now correctly extracting and storing fields like `amenities`, `pet_policy`, `features`, `manufacturer`, `model`, etc., but the data tables for Communities and Properties don't display these columns.

---

## Solution Overview

Add new columns to both table definitions to display the mapped fields that are now being synced from WordPress.

---

## Implementation Details

### Part 1: Update Locations (Communities) Columns

**File:** `src/components/data-table/columns/locations-columns.tsx`

Add the following new columns:

| Column | Field | Display Style |
|--------|-------|---------------|
| **Age Category** | `age_category` | Badge (All-Age, 55+, Family) |
| **Pet Policy** | `pet_policy` | Truncated text with tooltip |
| **Amenities** | `amenities` | Count badge with tooltip showing list |

**New columns to add after "Timezone":**

```tsx
{
  accessorKey: 'age_category',
  size: 100,
  minSize: 80,
  maxSize: 120,
  header: ({ column }) => <DataTableColumnHeader column={column} title="Age" />,
  cell: ({ row }) => {
    const ageCategory = row.original.age_category;
    if (!ageCategory) return <span className="text-muted-foreground">—</span>;
    
    const is55Plus = ageCategory.toLowerCase().includes('55') || 
                     ageCategory.toLowerCase().includes('senior');
    
    return (
      <Badge variant={is55Plus ? 'secondary' : 'outline'}>
        {is55Plus ? '55+' : 'All-Age'}
      </Badge>
    );
  },
},
{
  accessorKey: 'pet_policy',
  size: 120,
  minSize: 80,
  maxSize: 150,
  header: ({ column }) => <DataTableColumnHeader column={column} title="Pets" />,
  cell: ({ row }) => {
    const petPolicy = row.original.pet_policy;
    if (!petPolicy) return <span className="text-muted-foreground">—</span>;
    
    // Truncate long policies
    const truncated = petPolicy.length > 20 
      ? petPolicy.substring(0, 20) + '...' 
      : petPolicy;
    
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-sm cursor-help">{truncated}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[300px]">
          <p className="text-sm">{petPolicy}</p>
        </TooltipContent>
      </Tooltip>
    );
  },
},
{
  accessorKey: 'amenities',
  size: 100,
  minSize: 70,
  maxSize: 130,
  header: () => <span className="text-xs font-medium">Amenities</span>,
  cell: ({ row }) => {
    const amenities = row.original.amenities as string[] | null;
    if (!amenities || amenities.length === 0) {
      return <span className="text-muted-foreground">—</span>;
    }
    
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="cursor-help">
            {amenities.length}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-[300px]">
          <ul className="text-sm list-disc pl-4">
            {amenities.slice(0, 10).map((amenity, i) => (
              <li key={i}>{amenity}</li>
            ))}
            {amenities.length > 10 && (
              <li className="text-muted-foreground">
                +{amenities.length - 10} more
              </li>
            )}
          </ul>
        </TooltipContent>
      </Tooltip>
    );
  },
},
```

### Part 2: Update Properties Columns

**File:** `src/components/data-table/columns/properties-columns.tsx`

Add the following new columns:

| Column | Field | Display Style |
|--------|-------|---------------|
| **Sqft** | `sqft` | Formatted number with "sq ft" |
| **Year** | `year_built` | Plain number |
| **Manufacturer** | `manufacturer` | Text (truncated) |
| **Model** | `model` | Text (truncated) |
| **Lot Rent** | `lot_rent` | Currency formatted (/mo) |
| **Features** | `features` | Count badge with tooltip |

**New columns to add after "Beds/Baths":**

```tsx
{
  accessorKey: 'sqft',
  size: 90,
  minSize: 70,
  maxSize: 110,
  header: ({ column }) => <DataTableColumnHeader column={column} title="Sqft" />,
  cell: ({ row }) => {
    const sqft = row.original.sqft;
    if (!sqft) return <span className="text-muted-foreground text-sm">—</span>;
    return (
      <span className="text-sm tabular-nums">
        {sqft.toLocaleString()}
      </span>
    );
  },
},
{
  accessorKey: 'year_built',
  size: 70,
  minSize: 60,
  maxSize: 90,
  header: ({ column }) => <DataTableColumnHeader column={column} title="Year" />,
  cell: ({ row }) => {
    const year = row.original.year_built;
    if (!year) return <span className="text-muted-foreground text-sm">—</span>;
    return <span className="text-sm tabular-nums">{year}</span>;
  },
},
{
  id: 'make_model',
  size: 140,
  minSize: 100,
  maxSize: 180,
  header: () => <span className="text-xs font-medium">Make/Model</span>,
  cell: ({ row }) => {
    const manufacturer = row.original.manufacturer;
    const model = row.original.model;
    
    if (!manufacturer && !model) {
      return <span className="text-muted-foreground text-sm">—</span>;
    }
    
    const combined = [manufacturer, model].filter(Boolean).join(' ');
    const truncated = combined.length > 18 
      ? combined.substring(0, 18) + '...' 
      : combined;
    
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-sm truncate block max-w-[160px] cursor-help">
            {truncated}
          </span>
        </TooltipTrigger>
        {combined.length > 18 && (
          <TooltipContent>
            <p>{combined}</p>
          </TooltipContent>
        )}
      </Tooltip>
    );
  },
},
{
  accessorKey: 'lot_rent',
  size: 100,
  minSize: 80,
  maxSize: 120,
  header: ({ column }) => <DataTableColumnHeader column={column} title="Lot Rent" />,
  cell: ({ row }) => {
    const lotRent = row.original.lot_rent;
    if (!lotRent) return <span className="text-muted-foreground text-sm">—</span>;
    
    // Convert cents to dollars
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(lotRent / 100);
    
    return (
      <span className="text-sm tabular-nums whitespace-nowrap">
        {formatted}/mo
      </span>
    );
  },
},
{
  accessorKey: 'features',
  size: 90,
  minSize: 70,
  maxSize: 110,
  header: () => <span className="text-xs font-medium">Features</span>,
  cell: ({ row }) => {
    const features = row.original.features as string[] | null;
    if (!features || features.length === 0) {
      return <span className="text-muted-foreground text-sm">—</span>;
    }
    
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="cursor-help">
            {features.length}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-[300px]">
          <ul className="text-sm list-disc pl-4">
            {features.slice(0, 10).map((feature, i) => (
              <li key={i}>{feature}</li>
            ))}
            {features.length > 10 && (
              <li className="text-muted-foreground">
                +{features.length - 10} more
              </li>
            )}
          </ul>
        </TooltipContent>
      </Tooltip>
    );
  },
},
```

---

## Column Order Summary

### Locations Table (Communities)
1. Select ✓
2. Name ✓
3. Address ✓
4. Timezone ✓
5. **Age Category** ← NEW
6. **Pet Policy** ← NEW
7. **Amenities** ← NEW
8. Calendars ✓
9. Actions ✓

### Properties Table
1. Select ✓
2. Address ✓
3. Lot # ✓
4. Community ✓
5. Beds/Baths ✓
6. **Sqft** ← NEW
7. **Year** ← NEW
8. **Make/Model** ← NEW
9. **Lot Rent** ← NEW
10. **Features** ← NEW
11. Price ✓
12. Status ✓
13. Actions ✓

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/data-table/columns/locations-columns.tsx` | Add Age Category, Pet Policy, Amenities columns |
| `src/components/data-table/columns/properties-columns.tsx` | Add Sqft, Year, Make/Model, Lot Rent, Features columns |

---

## Visual Design

- **Badges** for categorical data (Age Category, counts)
- **Tooltips** for truncated text and array contents
- **Tabular numbers** for numeric columns (sqft, year, rent)
- **Dashes** for empty values (consistent with existing patterns)
- **Cursor hint** (`cursor-help`) for elements with tooltips

---

## No Hook Changes Required

Both `useLocations` and `useProperties` hooks already fetch all columns with `select('*')`, so no changes are needed to the data fetching layer.
