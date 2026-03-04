-- ============================================================
-- FULL DATA EXPORT (INSERT STATEMENTS)
-- Amruta Water Solutions
-- Generated: 2026-03-04
-- ============================================================
-- Run this AFTER running database-schema-export.sql
-- NOTE: user_roles and profiles are auto-created by triggers
-- when users sign up, so they are included here only for
-- reference/manual seeding.
-- ============================================================

-- ============================================================
-- 1. TESTIMONIALS
-- ============================================================

INSERT INTO public.testimonials (id, display_order, is_visible, name, organization, text, created_at, updated_at) VALUES
('e3695523-257b-4ea9-b540-5e3a196b475f', 0, true, 'Rajesh Lokhande', 'Vatika Society', 'This is - from Vatika Society - Balewadi- PUNE - having 3 Buildings & 193 Flats. We used to spend 7 to 8 tankers in a day and Rs. 70,000/- to 80,000/- in a month and totally Rs. 8 Lakh to 9 Lakh in a Year for Tankers. Earlier We had a failure with Convention method (survey done by other third party vendor) called Copper Dowsing Rods. We approached Amrutha Ground Water Discovery, to perform Ground Water Survey, and they visited and Survey done with an American Intelligent Ground Water Discovery Machine and they have suggested 4 Bore Points in the Report and out of which they have recommended Greatest Ground Water resource point and we have drilled it and got more than 2 inch of water and we switch the Motor on for 2 to 3 hours and gives us 7 to 8 tankers (80,000 Liters) and it is sufficient for ONE DAY consumption. Now we are saving around Rs. 70,000/- to 80,000/- in a month. Yearly we are saving around Rs. 8 Lack to 9 Lack. They have made us to realize the important', '2026-02-18 06:57:20.753828+00', '2026-02-18 06:57:20.753828+00'),
('997967e8-48d2-444b-857c-4f000f504ebe', 1, true, 'Kalpana Pillai', '', 'If you are in need of ground water survey, surely would recommend them.', '2026-02-18 06:57:20.753828+00', '2026-02-18 06:57:20.753828+00'),
('15e3728d-52db-4587-aca9-730f1dfd0fbc', 2, true, 'Vineet Kulkarni', '', 'Got rainwater harvesting done for my society. Highly effective results. Literally the best.', '2026-02-18 06:57:20.753828+00', '2026-02-18 06:57:20.753828+00'),
('60e85754-a647-493a-aaba-dfd88363d92c', 3, true, 'Pratima Gupte', 'Pebbles Coop Housing Society', 'We have 233 flats in our society, our daily demand is about 10-15 tankers of water. Earlier our builder and society had drilled 11 bore-wells and all of them were ended up with a failure. We used to spend Rs.25-28 lakhs of rupees for tanker yearly. We have approached Amrutha Ground Water Discovery for the ground water survey and they have done 5 scans with an American technological device including GPS mapping. They submitted the report with 5 top most yielding/greatest ground water resource points. We have drilled the bore-well. Got on point - 1: 2.5 inch of water. On Point - 2: 2.0 inch of water. On Point - 3: 1.5 inch around. Now we are completely free from tankers as earlier we used to spend for tankers = Rs. 26 Lakhs/Year. Currently spending (NO TANKERS) = 3 Lakhs/Year (Only for Power Bill) Current savings = Rs. 23 Lakhs/Year.', '2026-02-18 06:57:20.753828+00', '2026-02-18 06:57:20.753828+00');

-- ============================================================
-- 2. SERVICES
-- ============================================================

INSERT INTO public.services (id, display_order, is_main, title, description, image, link, created_at, updated_at) VALUES
('8bbc9d60-1dee-4bcd-afac-55bc415606be', 1, true, 'Rain GEO APP', 'Platform for Rainwater Harvesting, Stormwater Drainage Design and High Flood Level assessment.', 'https://media.istockphoto.com/id/2076917409/vector/green-storm-water-infrastructure-with-rain-absorption-methods-outline-diagram.jpg?s=2048x2048&w=is&k=20&c=2j1bIaVIac-Vk9AjymzaXiX3Gpf4r3DQE7j_Ql9DKuU=', 'https://rain.amrutageo.com/', '2026-02-07 03:57:53.461804+00', '2026-02-10 10:59:47.363153+00'),
('73a6b447-e4e9-421a-9485-501984a78eec', 2, true, 'Water Audit · Net Zero / ZLD', 'Water audits, leak detection, SCADA dashboards and compliance solutions.', 'https://sfjxughxjvbuhocbmggp.supabase.co/storage/v1/object/public/main/services/1771422898706-vratnmtjnrs.png', NULL, '2026-02-07 03:57:53.461804+00', '2026-02-18 13:55:03.660199+00'),
('be367647-78d8-4ebe-aca7-61caddc50ebb', 3, true, 'iGEO Scanning', 'Geo physical surveys and subsurface scanning for construction and leakage detection.', 'https://hannaplumbingheating.com/wp-content/uploads/2024/11/men-working-leak-illustration.jpg', NULL, '2026-02-07 03:57:53.461804+00', '2026-02-07 03:57:53.461804+00'),
('1e1707b7-4081-4243-a2b9-e8253b158c75', 4, true, 'GPS Zone Mapping', 'Large-area mapping to improve survey accuracy across surrounding zones.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT58jNTX4JhZq26UU5AGHrbRm8Wlrd-DJjInul9TcLZ0IfeVQo4', NULL, '2026-02-07 03:57:53.461804+00', '2026-02-07 03:57:53.461804+00'),
('fcf97c70-b602-48f6-9521-33f9fc77ac98', 5, true, 'EC & MEP Designing and Consulting', 'Environment clearance and MEP design services for residential, commercial and industrial projects.', 'https://media.skilldeer.com/720x450/d86b373a84d838c534d37fbaf7a0d00dc04581e4.webp', NULL, '2026-02-07 03:57:53.461804+00', '2026-02-07 03:57:53.461804+00'),
('795b3d26-4a0e-419a-9d44-71b02634dfcd', 6, true, 'Geological & Ground Water Survey', 'Magnetic dowsing, electrical resistivity and AiGWD methods for groundwater identification.', 'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcRqH0zeBeWlwsqoISWfWz0JMqGVkv4sH8CTALDIBEelPTncSAGd', NULL, '2026-02-07 03:57:53.461804+00', '2026-02-07 06:28:16.523285+00'),
('1ae038ce-1bcb-4910-8b29-742b681cf7c1', 7, false, 'Rain Water Harvesting', 'Intelligent rainwater harvesting systems for groundwater stabilization.', 'https://media.istockphoto.com/id/1298320859/vector/rainwater-harvesting-as-water-resource-accumulation-for-home-outline-concept.jpg?s=2048x2048&w=is&k=20&c=kGLSnYfnl9uF_J6Q0bSj7R6L0UtO8bXvpFRLJjP5VUw=', NULL, '2026-02-07 03:57:53.461804+00', '2026-02-07 03:57:53.461804+00'),
('024a0fc1-7731-49b1-820b-5b82f3155dab', 8, false, 'GPR & Thermal Imaging Scanning', 'Ground-penetrating radar and thermal imaging for leak and utility detection.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbRikzLYAOTLC7tdXdK9at7Yg7KL76oqcHxEocIHTwn1TGiyX1', NULL, '2026-02-07 03:57:53.461804+00', '2026-02-07 03:57:53.461804+00'),
('af6a46c4-d8ff-46be-bc5b-0cfc094abf11', 9, false, 'Watershed Management Services', 'Contour-based design, aquifer mapping and runoff management for long-term results.', 'https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcRYb5SLj4CZHdxhUKsHaPXVci7uJtVwygbTtoetn5hcUMeo5OPe', NULL, '2026-02-07 03:57:53.461804+00', '2026-02-07 03:57:53.461804+00'),
('37ba7e8e-a9d7-43f6-b89e-c45b9d70157c', 10, false, 'EC & Green Building Consulting', 'Guidance on environmental clearances and green building practices for commercial and domestic projects.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIWi13me1bwqzxk6vcnIZjacoEO-rBvwvj32-CuXic5Z-7kc3o', NULL, '2026-02-07 03:57:53.461804+00', '2026-02-07 03:57:53.461804+00'),
('5938ff60-d1fc-4c26-9528-3e69473d9912', 11, false, 'STP & ETP Solutions', 'Wastewater treatment plant design and plant manufacturing (STP/ETP).', 'https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcSn8RJ5Ul-Z3d5Cfqdm7kWv-t2yTuI3RGbW3iNltqmkmsxFKgBC', NULL, '2026-02-07 03:57:53.461804+00', '2026-02-07 03:57:53.461804+00'),
('a0572471-5ff4-4990-891e-1f20b85fd490', 12, false, 'Water Treatment Plant Manufacturing', 'Manufacture and supply of mineral & alkaline water treatment plants.', 'https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcRh_t__MqG9uVe14SI5fYhyFXojvXIGs5VGo8XPT_7viEZ8MwE0', NULL, '2026-02-07 03:57:53.461804+00', '2026-02-07 03:57:53.461804+00'),
('af9e63fe-63f0-4abd-998e-a5999c4265ca', 13, false, 'Energy Saving Solutions', 'Energy-saving schemes and motor/pump replacements to reduce power bills.', 'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcQdPASNRo3jwdZTTh2qhpVtATAMdTKxVWydSGg-oMqqVXYmOmzp', NULL, '2026-02-07 03:57:53.461804+00', '2026-02-07 03:57:53.461804+00'),
('22d4e077-7223-45e7-8fd6-b914ef4222c4', 14, false, 'CGWB Registration Services', 'Consultancy for CGWB (Central Ground Water Board) registration and compliance.', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuw4dBkm_1TOjwUN-myEavY3JLzoAfXR5ccBi4nrKEU37LrVfp', NULL, '2026-02-07 03:57:53.461804+00', '2026-02-07 03:57:53.461804+00'),
('ff1fa7fd-2fc6-4daa-8500-104b10613d89', 15, false, 'Bathymetry / SONAR', 'Bathymetric surveys for lakes, ponds and coastal regions — mapping silt, tides and water properties.', 'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcSXnDtPubGoyASCpsFbd9tc1JrEs12XzkViNOLczyyNhXqmK-jP', NULL, '2026-02-07 03:57:53.461804+00', '2026-02-07 03:57:53.461804+00');

-- ============================================================
-- 3. GALLERY IMAGES
-- ============================================================

INSERT INTO public.gallery_images (id, display_order, is_visible, image_url, caption, created_at, updated_at) VALUES
('ca5160d2-0b66-4df8-9af1-ad4de9b790c3', 0, true, 'https://sfjxughxjvbuhocbmggp.supabase.co/storage/v1/object/public/main/gallery/1771138368135.png', NULL, '2026-02-15 06:52:49.761075+00', '2026-02-15 06:52:49.761075+00'),
('d761bc65-15cc-4adf-942c-999932d3f6f9', 1, true, 'https://sfjxughxjvbuhocbmggp.supabase.co/storage/v1/object/public/main/gallery/1771138388009.png', NULL, '2026-02-15 06:53:08.777043+00', '2026-02-15 06:53:08.777043+00'),
('b0993c40-9568-4ac6-ba35-74d0afb6bf54', 2, true, 'https://sfjxughxjvbuhocbmggp.supabase.co/storage/v1/object/public/main/gallery/1771138530533.png', NULL, '2026-02-15 06:55:31.458837+00', '2026-02-15 06:55:31.458837+00'),
('0b7a2e26-fec8-45df-a514-81517013a091', 3, true, 'https://sfjxughxjvbuhocbmggp.supabase.co/storage/v1/object/public/main/gallery/1771138600271.jpg', NULL, '2026-02-15 06:56:41.546874+00', '2026-02-15 06:56:41.546874+00');

-- ============================================================
-- 4. SITE CONTENT
-- ============================================================

INSERT INTO public.site_content (id, section_key, title, content, metadata, updated_at) VALUES
('b824fd33-74e1-40e0-8f07-205cd3805bab', 'about', 'About Us', E'Established in the year 1990 at HYDERABAD, and extended services also to PUNE, MUMBAI, and BANGALORE. Amruta Integrated Water Solutions Pvt. Ltd., is one of the market leaders in NET ZERO / Water Audit, ZLD, Rainwater Harvesting, Groundwater Surveyors, Geological Surveys, EC Consulting, MEP Designing & Consulting, Ground Water Survey, Thermal Imaging Survey Rainwater Harvesting, Energy Saving, and Renewable Energy.\n\nWith around 35+ years of experience, we are skilled to provide advice and assistance for EC, MEP, CGWB Registration, Ground Water management, etc.\n\nOur team works proficiently to find the Ground Water resource point for Borewell drilling and provide expert consultancy to make our clients understand the concept of rainwater harvesting. We provide effective designs of the systems keeping in mind the positive impact on the environmental perspective. We believe in absolute client satisfaction and accordingly, render our services. This has helped us to create an ever-increasing clientele base.', '{"stats":[{"icon":"Award","label":"Years Experience","value":"35+"},{"icon":"Building2","label":"Office Locations","value":"4"},{"icon":"Users","label":"Projects Completed","value":"1000+"},{"icon":"MapPin","label":"Service Coverage","value":"Pan India"}]}', '2026-02-16 04:00:13.515+00'),

('1560e455-e7d2-4115-a968-5e1b5a14818a', 'contact_details', 'Get In Touch', NULL, '{"emails":["rain@amrutawater.com"],"phones":["+91-741-0030-418","+91-741-0030-417"]}', '2026-02-09 14:33:23.059+00'),

('449358e5-e93b-4a4f-8204-d8770d2c3de7', 'footer', NULL, NULL, '{"description":"Leading the World''s Sustainable Water Revolution for over 35+ years.","email":"rain@amrutawater.com","head_office_address":"Off: 207, Bhoomi Allium, Kokane Chowk, Pimple Soudagar, Pune, Maharashtra-411027, INDIA","head_office_label":"Head Office:","help_email":"rain@amrutawater.com","help_website":"www.amrutawater.com","locations_subtext":"INDIA & REST OF THE WORLD","locations_text":"PUNE | MUMBAI | HYDERABAD | BANGALORE","phone_numbers":["+91-741-0030-418","+91-741-0030-417"],"quick_links":[{"emoji":"📊","label":"Rain GEO APP","url":"https://rain.amrutageo.com/"}],"tagline":"Start Now — Let Every Drop Count","tagline_quote":"\"Meeting the Challenge of Nature\" - Not Just a Slogan, A Way of Life.","version":"1.0.0.2","website":"www.amrutawater.com"}', '2026-02-15 07:17:11.608+00'),

('7481a6ec-2508-4624-a39a-ba2421c2ed46', 'hero', 'Integrated Water & Environmental Solutions', 'Professional water management and environmental consulting services', '{"backgroundImage":"https://images.timesproperty.com/blog/6313/A_Comprehensive_Guide_To_Rooftop_Rainwater_Harvesting.png","services":["EC Consulting Services","Ground Water Survey","Geo-Technical Services","Rainwater Harvesting","GPR & Thermal Scanning","STP, ETP & WTP","Energy Saving Solutions","CGWB Registration Services"]}', '2026-01-28 15:26:16.546708+00'),

('9adc4da6-5365-4501-b98e-93528e055718', 'legal_notice', 'Legal Declaration / Copyright Notice', E'All rights reserved. No part of this website may be reproduced, distributed, or transmitted in any form or by any means, including photocopying, recording, or other electronic or mechanical methods, without the prior written permission of the publisher, except in the case of brief embedded in critical reviews and certain other non-commercial uses permitted by copyright law. For permission requests, write to the publisher, addressed "Attention: Permissions Coordinator," at the address below.', '{"company_note":"(AMRUTA GROUND WATER DISCOVERY) is now an AMRUTA INTEGRATED WATER SOLUTIONS PVT. LTD. Company.","copyright_line":"Copyright © 2025 by AMRUTA INTEGRATED WATER SOLUTIONS PVT. LTD.","disclaimer":"The Technology of the Survey Process, the website contents, and address shall change without notice. Contact us for the latest information."}', '2026-02-19 08:22:13.741684+00'),

('5f4b2331-dfda-4f9c-85aa-9a5b942f04b9', 'navbar', 'Navbar Settings', 'Navbar configuration', '{"company_name":"Amruta Hydrogeo Services","external_link":{"name":"Rain Geo App","url":"https://rain.amrutageo.com/"},"logo_url":"","nav_links":[{"href":"#home","name":"Home"},{"href":"#services","name":"Services"},{"href":"#about","name":"About Us"},{"href":"#why","name":"Why Us"},{"href":"#contact","name":"Contact"}]}', '2026-02-14 17:45:09.848+00'),

('b2810466-d1c0-45ca-8227-5198b8bbfbda', 'offices', 'Our Offices', 'Office locations', '{"offices":[{"address":"Head Office -301, Fortuna Business Park, Shivar Chowk, Pimple Saudagar, Pimpri Chinchwad, Pune, Maharashtra - 411061","city":"Pune","lat":18.5997,"lng":73.7997,"phone":"+91-741-0030-418","whatsapp":"+91-741-0030-418"},{"address":"Branch Office - Mumbai, Maharashtra","city":"Mumbai","lat":19.076,"lng":72.8777,"phone":"+91-741-0030-418","whatsapp":"+91-741-0030-418"},{"address":"Branch Office - Hyderabad, Telangana","city":"Hyderabad","lat":17.385,"lng":78.4867,"phone":"+91-741-6910-618","whatsapp":"+91-741-6910-618"},{"address":"Branch Office - Bangalore, Karnataka","city":"Bangalore","lat":12.9716,"lng":77.5946,"phone":"+91-741-0030-417","whatsapp":"+91-741-0030-417"}]}', '2026-03-02 03:56:01.42+00'),

('54930cea-5ca6-4e76-8061-5a698ab48523', 'settings', 'Site Settings', 'General site settings', '{"whatsapp_number":"917410030418"}', '2026-02-06 05:36:19.871213+00'),

('a4db6349-011c-4484-bc0e-37306cdf8b27', 'whyus', 'Why Partner With Us', E'Trusted by hundreds of clients across India for our expertise, reliability, and commitment to excellence.\nWe deliver results, not just reports. Here''s what sets us apart.', '{"reasons":[{"description":"Experienced experts and committed professionals with decades of industry knowledge.","icon":"Users","title":"Expert Team"},{"description":"Qualitative, efficient, and cost-effective solutions tailored to your needs.","icon":"Lightbulb","title":"Quality Solutions"},{"description":"Detailed, research-backed technological surveys for accurate results.","icon":"Search","title":"Research-Backed"},{"description":"Full regulatory compliance with CGWB, environmental, and building codes.","icon":"Shield","title":"Compliance Assured"},{"description":"On-time project completion with transparent progress updates.","icon":"Clock","title":"Timely Delivery"},{"description":"Absolute client satisfaction with personalized service and support.","icon":"HeartHandshake","title":"Client Focused"}]}', '2026-02-06 06:22:05.924+00');

-- ============================================================
-- 5. CONTACT MESSAGES
-- ============================================================

INSERT INTO public.contact_messages (id, is_read, name, email, phone, service, message, created_at) VALUES
('872f8b0a-9294-44ef-b584-6f04f95f21e1', true, 'vijay', 'vijayganeshb21@gmail.com', '9398195564', 'GPS Zone Mapping', '[Location: Other] i want your servies in my home water is leakaging', '2026-02-21 05:33:47.758434+00'),
('5b7b4e7c-e9d6-4491-a9c3-bee28da0dd78', true, 'Manu', 'forlog.exe@gmail.c0om', '9848673210', 'Water Audit · Net Zero / ZLD', '[Location: Hyderabad] ', '2026-02-21 05:34:13.136438+00');

-- ============================================================
-- 6. PROFILES (auto-created by trigger, included for reference)
-- ============================================================

INSERT INTO public.profiles (id, user_id, full_name, phone, created_at, updated_at) VALUES
('00c5ad83-c54e-4890-b986-ee94dafeb71e', 'd0fd7a0a-e889-42d8-b834-3aae0c88465d', 'Deekshith Reddy Boddu', '9966533554', '2026-02-19 10:15:08.48858+00', '2026-02-19 10:15:08.48858+00'),
('5f628e3e-9ca5-435c-a848-3515d4cad116', 'f7a3e5f3-91f3-4178-a87f-3506e0f3cb9b', 'Deekshith Reddy Boddu', '9966533554', '2026-03-02 04:38:16.95498+00', '2026-03-02 04:38:16.95498+00');

-- ============================================================
-- 7. USER ROLES (auto-created by trigger, included for reference)
-- NOTE: You'll need to manually assign admin roles after
-- users sign up on the new project.
-- ============================================================

INSERT INTO public.user_roles (id, user_id, role, created_at) VALUES
('15cbf49c-83a3-4489-b695-4e304d60ebce', 'e00d115e-0240-47a7-a128-9f3af495a7d5', 'user', '2026-01-26 05:08:25.163372+00'),
('6c8ef17d-492d-4e85-8f9d-faa8e5a9e724', 'e00d115e-0240-47a7-a128-9f3af495a7d5', 'admin', '2026-01-26 05:12:42.633868+00'),
('27a79f08-19a1-4f5d-9263-c3aa4db0aac7', 'd0fd7a0a-e889-42d8-b834-3aae0c88465d', 'admin', '2026-02-19 10:15:08.48858+00'),
('342dc8fe-0087-40f4-b78e-940ccbeee0a5', 'f7a3e5f3-91f3-4178-a87f-3506e0f3cb9b', 'user', '2026-03-02 04:38:16.95498+00');

-- ============================================================
-- 8. EMPTY TABLES (no data)
-- ============================================================
-- bookings: 0 rows
-- reviews: 0 rows
-- saved_services: 0 rows
-- order_tracking: 0 rows

-- ============================================================
-- END OF DATA EXPORT
-- ============================================================
