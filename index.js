const express = require("express");
const app = express();
const port = 8080;
const path = require('path');
const methodOverride = require('method-override');
const multer = require("multer");
const fs = require("fs");
const mysql = require('mysql2');
const expressLayouts = require('express-ejs-layouts');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'VDK_26@Kapadi',
    database: 'my_blog'
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/';
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

app.use(expressLayouts);
app.set('layout', 'layouts/boilerplate');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, "/public")));
const upload = multer({ storage: storage });
app.use('/uploads', express.static('uploads'));

app.get("/", (req, res) => {
    res.send("Working");
});

app.get("/blogs", (req, res) => {
    const q = "SELECT * FROM posts;";

    connection.query(q, (err, results) => {
        if (err) {
            console.error("Error executing query:", err);
            return res.status(500).send("Internal Server Error");
        }

        res.render("blogs/index", { blogs: results });
    });
});

app.get("/signup", (req, res) => {
    res.render('blogs/signup');
});

app.post("/signup", (req, res) => {
    let { username, email, password } = req.body;
    let q = `INSERT INTO users (email, username, password) VALUES (?, ?, ?)`;
    try {
        connection.query(q, [email, username, password], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).send('Email already exists. Please use a different email.');
                } else {
                    console.error("Error inserting user:", err);
                    return res.status(500).send("Error in database operation");
                }
            }
            res.redirect("./login");
        });
    } catch (err) {
        console.error("Error inserting user:", err);
        res.status(500).send("Error in database operation");
    }
});

app.get("/login", (req, res) => {
    res.render("blogs/login");
});

app.post("/login", (req, res) => {
    try {
        let { username, password } = req.body;
        let q = `SELECT * FROM users WHERE username=? AND password=?`;

        connection.query(q, [username, password], (err, userResults) => {
            if (err) {
                console.error("Error executing query:", err);
                return res.status(500).send("Internal Server Error");
            }
            if (userResults.length > 0) {
                const email = userResults[0].email;
                console.log("Email:", email);
                const q2 = `SELECT * FROM blogs`;

                connection.query(q2, (err, postResults) => {
                    if (err) {
                        console.error("Error fetching posts:", err);
                        return res.status(500).send("Error in database operation");
                    }

                    console.log("Posts fetched successfully.");
                    res.render("blogs/index", { blogs: postResults });
                });
            } else {
                res.status(401).send("Invalid username or password");
            }
        });
    } catch (err) {
        console.error("An error occurred:", err);
        res.status(500).send("Internal Server Error");
    }
});

// app.get("/login", (req, res) => {
//     res.render("blogs/login");
// });

// app.post("/login", (req, res) => {
//     try {
//         let { username, password } = req.body;
//         let q = `SELECT * FROM users WHERE username=? AND password=?`;

//         connection.query(q, [username, password], (err, results) => {
//             if (err) {
//                 console.error("Error executing query:", err);
//                 return res.status(500).send("Internal Server Error");
//             }
//             if (results.length > 0) {
//                 const email = results[0].email;
//                 console.log("Email:", email);
//                 const q2 = `SELECT * FROM posts`;

//             connection.query(q2,  (err, results) => {
//                 if (insertErr) {
//                     console.error("Error inserting data into the blogs table:", insertErr);
//                     return res.status(500).send("Error in database operation");
//                 }

//                 console.log("Data inserted successfully into the blogs table.");
//                 // res.send("Blog inserted");
//                 res.redirect(`blog/index`,{blogs:results})
//             });
//                 // res.render("blogs", { username, email });
//             } else {
//                 res.status(401).send("Invalid username or password");
//             }
//         });
//     } catch (err) {
//         console.error("An error occurred:", err);
//         res.status(500).send("Internal Server Error");
//     }
// });

app.get("/create-blog",(req,res)=>{
    // let username="vijay";
    res.render("blogs/create-blog",{username:"vijay"});
})
app.put("/create-blog/:username", upload.single("image"), (req, res) => {
    const { title, description } = req.body;
    const image = req.file;
    const username = req.params.username;

    console.log("Username: ", username);
    console.log("Title: ", title);
    console.log("Description: ", description);
    console.log("Image: ", image);

    try {
        // Retrieve user_id based on username
        const getUserIdQuery = `SELECT id FROM users WHERE username = ?`;

        connection.query(getUserIdQuery, [username], (getUserErr, userResults) => {
            if (getUserErr) {
                console.error("Error retrieving user ID:", getUserErr);
                return res.status(500).send("Error in database operation");
            }

            if (userResults.length === 0) {
                return res.status(404).send("User not found");
            }

            const user_id = userResults[0].id;

            const insertQuery = `INSERT INTO blogs (title, description, image, user_id) VALUES (?, ?, ?, ?)`;

            connection.query(insertQuery, [title, description, image.filename, user_id], (insertErr, insertResults) => {
                if (insertErr) {
                    console.error("Error inserting data into the blogs table:", insertErr);
                    return res.status(500).send("Error in database operation");
                }

                console.log("Data inserted successfully into the blogs table.");
                // res.send("Blog inserted");
                res.redirect(`/post?username=${username}`)
            });
        });
    } catch (err) {  
        console.error("An error occurred:", err);
        res.status(500).send("Internal Server Error");
    }
});




app.get("/post", (req, res) => {
    let q = "SELECT * FROM blogs";
    connection.query(q, (err, results) => {
        if (err) {
            console.error("Error fetching data from the blogs table:", err);
            return res.status(500).send("Error in database operation");
        }
        // console.log(results[0]);
        res.render("blogs/index", { blogs: results });
    });
});

app.get("/blogs/:post_id/update", (req, res) => {
    let { post_id } = req.params;
    let q = "SELECT * FROM blogs WHERE post_id=?";
    connection.query(q, [post_id], (err, results) => {
        if (err) {
            console.error("Error fetching data from the blogs table:", err);
            return res.status(500).send("Error in database operation");
        }
        console.log(results);
        res.render("blogs/update", { blog: results[0] });
    });
});
app.put("/blogs/:post_id", upload.single("image"), (req, res) => {
    const { post_id } = req.params;  
    const { title, content } = req.body;
    const newImg = req.file ? `/uploads/${req.file.filename}` : req.body.image;
    console.log(req.file);
    // Validate input data
    if (!title || !content || !newImg) {
        return res.status(400).send("Invalid input data");
    }

    // Construct the update query
    const updateQuery = `UPDATE blogs SET title = ?, description = ?, image = ? WHERE post_id = ?`;

    // Execute the update query
    connection.query(updateQuery, [title, content, newImg, post_id], (err, result) => {
        if (err) {
            console.error("Error updating blog post:", err);
            return res.status(500).send("Error updating blog post");
        }

        // Check if the blog post was found and updated
        if (result.affectedRows === 0) {
            return res.status(404).send("Blog post not found");
        }

        // Redirect to the updated blog post
        // res.redirect("/blogs");
        const q2 = `SELECT * FROM blogs`;

                connection.query(q2, (err, postResults) => {
                    if (err) {
                        console.error("Error fetching posts:", err);
                        return res.status(500).send("Error in database operation");
                    }

                    console.log("Posts fetched successfully.");
                    res.render("blogs/index", { blogs: postResults });
                });
    });
});

app.get("/blogs/:post_id", (req, res) => {
    const { post_id } = req.params;
    
    // Fetch the updated blog post from the database
    const selectQuery = `SELECT * FROM blogs WHERE post_id = ?`;

    connection.query(selectQuery, [post_id], (err, results) => {
        if (err) {
            console.error("Error fetching updated blog post:", err);
            return res.status(500).send("Error fetching updated blog post");
        }

        // Render the updated blog post
        res.render("blogs/index", { blogs: results });
    });
});

app.delete("/blogs/:post_id", (req, res) => {
    const { post_id } = req.params;
    
    // Construct the delete query
    const deleteQuery = `DELETE FROM blogs WHERE post_id = ?`;

    // Execute the delete query
    connection.query(deleteQuery, [post_id], (err, result) => {
        if (err) {
            console.error("Error deleting blog post:", err);
            return res.status(500).send("Error deleting blog post");
        }

        // Check if the blog post was found and deleted
        if (result.affectedRows === 0) {
            return res.status(404).send("Blog post not found");
        }

        // Blog post deleted successfully
        // res.redirect("/blogs");
        const q2 = `SELECT * FROM blogs`;

                connection.query(q2, (err, postResults) => {
                    if (err) {
                        console.error("Error fetching posts:", err);
                        return res.status(500).send("Error in database operation");
                    }

                    console.log("Posts fetched successfully.");
                    res.render("blogs/index", { blogs: postResults });
                });
    });
});

app.use((req,res)=>{
    res.status(404).send("page not found");
})

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});


