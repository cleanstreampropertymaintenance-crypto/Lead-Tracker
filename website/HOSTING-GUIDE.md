# How to Host Your Website on GoDaddy

## Option 1: GoDaddy Web Hosting (Recommended - $5-10/month)

### Step 1: Buy Hosting
1. Go to **godaddy.com** and log in
2. Go to **Hosting** > **Web Hosting**
3. Buy the cheapest plan ("Economy" works fine for a static site)
4. During checkout, connect your existing domain **cleanstreamprowash.com**

### Step 2: Upload Your Files
1. In your GoDaddy account, go to **My Products** > **Web Hosting** > **Manage**
2. Open **cPanel** (your hosting control panel)
3. Click **File Manager**
4. Navigate to the **public_html** folder
5. **Delete** everything currently in public_html (the default GoDaddy placeholder files)
6. Click **Upload** at the top
7. Upload ALL of these files/folders:
   ```
   index.html
   css/          (folder with styles.css)
   js/           (folder with main.js)
   services/     (folder with all service pages)
   images/       (folder - add your photos here)
   ```
8. Make sure `index.html` is directly inside `public_html` (not in a subfolder)

### Step 3: Verify
1. Go to **cleanstreamprowash.com** in your browser
2. You should see your new site!
3. If you see the old Weebly site, you need to update your domain's DNS (see below)

### Step 4: Point Your Domain (if needed)
If your domain currently points to Weebly, you need to change it:
1. Go to **GoDaddy** > **My Products** > **Domains** > **cleanstreamprowash.com** > **DNS**
2. Find the **A Record** that points to Weebly's IP address
3. Change it to point to your GoDaddy hosting IP (shown in your hosting dashboard)
4. Remove any CNAME records pointing to Weebly
5. Wait 1-48 hours for DNS to propagate

---

## Option 2: Transfer Domain from Weebly to GoDaddy

If your domain is currently registered through Weebly:

1. **In Weebly**: Go to Settings > SEO > scroll down and find domain settings, or contact Weebly support to get your **domain authorization/EPP code**
2. **In GoDaddy**: Go to **Domains** > **Transfer** > enter **cleanstreamprowash.com**
3. Enter the authorization code Weebly gave you
4. Pay the transfer fee (~$10-15 for one year renewal)
5. Confirm the transfer via the email GoDaddy sends you
6. Wait 5-7 days for the transfer to complete
7. Then follow Steps 1-3 above to set up hosting

---

## Setting Up Your Contact Form

The contact form uses **Formspree** (free for up to 50 submissions/month):

1. Go to **formspree.io** and create a free account
2. Click **New Form** and name it "Clean Stream Contact"
3. Copy your form ID (looks like `xyzabcde`)
4. Open `index.html` in a text editor
5. Find this line:
   ```html
   <form class="contact-form" id="contact-form" action="https://formspree.io/f/YOUR_FORM_ID"
   ```
6. Replace `YOUR_FORM_ID` with your actual form ID
7. Do the same in each service page's contact section if applicable
8. Re-upload the updated files to GoDaddy

Form submissions will go to your Formspree dashboard and be emailed to you.

---

## Adding Your Photos

The site has placeholder spots for images. To add your real photos:

1. Put your photos in the `images/` folder
2. Name them clearly: `hero.jpg`, `team.jpg`, `before-after-1.jpg`, etc.
3. In `index.html`, replace the placeholder divs with actual `<img>` tags:
   ```html
   <!-- Replace this: -->
   <div class="about-img-placeholder">
     <div class="placeholder-text">Your Photo Here</div>
   </div>

   <!-- With this: -->
   <div class="about-img-placeholder">
     <img src="images/team.jpg" alt="Clean Stream Pro Wash team in Grand Rapids, MI">
   </div>
   ```
4. For the hero section, you can add a background image in `css/styles.css`:
   ```css
   .hero::before {
     background: url('../images/hero.jpg') center/cover;
   }
   ```

### Photo Tips for SEO
- Use descriptive file names: `pressure-washing-grand-rapids-driveway.jpg` (not `IMG_3847.jpg`)
- Always include alt text that describes the image AND includes your location
- Resize photos to max 1600px wide before uploading (keeps the site fast)
- Use .jpg for photos, .png for logos/icons
