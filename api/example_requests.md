# Cook's API — Example Requests

This guide shows how to interact with the generated PHP backend.

## 1. Create a User
**Endpoint:** `api/create_user.php`  
**Method:** `POST`

### Request Body (Form Data)
- `username`: ChefMalak
- `email`: malak@example.com
- `password`: secure123

### Example using cURL
```bash
curl -X POST http://localhost/try_cooks/api/create_user.php \
     -d "username=ChefMalak" \
     -d "email=malak@example.com" \
     -d "password=secure123"
```

---

## 2. Get All Users
**Endpoint:** `api/get_users.php`  
**Method:** `GET`

### Example using cURL
```bash
curl http://localhost/try_cooks/api/get_users.php
```

---

## 3. Create a Recipe
**Endpoint:** `api/create_recipe.php`  
**Method:** `POST`

### Request Body (Form Data)
- `title`: Mansaf
- `country`: Jordan
- `level`: Hard
- `prep_time`: 3h
- `category`: arabic
- `story`: A traditional Jordanian dish.
- `image_url`: https://example.com/mansaf.jpg

### Example using cURL
```bash
curl -X POST http://localhost/try_cooks/api/create_recipe.php \
     -d "title=Mansaf" \
     -d "country=Jordan" \
     -d "level=Hard" \
     -d "prep_time=3h" \
     -d "category=arabic" \
     -d "story=A traditional Jordanian dish." \
     -d "image_url=https://example.com/mansaf.jpg"
```

---

## 4. Get All Recipes
**Endpoint:** `api/get_recipes.php`  
**Method:** `GET`

### Example using cURL
```bash
curl http://localhost/try_cooks/api/get_recipes.php
```
