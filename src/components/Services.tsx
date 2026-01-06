import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import ServiceCard from "./ServiceCard";
const mainServices = [{
  title: "Rainwater · Stormwater · HFL PMS",
  description: "Platform for Rainwater Harvesting, Stormwater Drainage Design and High Flood Level assessment.",
  image: "https://media.istockphoto.com/id/2076917409/vector/green-storm-water-infrastructure-with-rain-absorption-methods-outline-diagram.jpg?s=2048x2048&w=is&k=20&c=2j1bIaVIac-Vk9AjymzaXiX3Gpf4r3DQE7j_Ql9DKuU=",
  link: "https://rain.amrutageo.com/"
}, {
  title: "Water Audit · Net Zero / ZLD",
  description: "Water audits, leak detection, SCADA dashboards and compliance solutions.",
  image: "https://cdn.cseindia.org/large/2022-06-08/0.69484300_1654666962_wa.jpg"
}, {
  title: "iGEO Scanning",
  description: "Geo physical surveys and subsurface scanning for construction and leakage detection.",
  image: "https://hannaplumbingheating.com/wp-content/uploads/2024/11/men-working-leak-illustration.jpg"
}, {
  title: "GPS Zone Mapping",
  description: "Large-area mapping to improve survey accuracy across surrounding zones.",
  image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT58jNTX4JhZq26UU5AGHrbRm8Wlrd-DJjInul9TcLZ0IfeVQo4"
}, {
  title: "EC & MEP Designing and Consulting",
  description: "Environment clearance and MEP design services for residential, commercial and industrial projects.",
  image: "https://media.skilldeer.com/720x450/d86b373a84d838c534d37fbaf7a0d00dc04581e4.webp"
}, {
  title: "Geological & Ground Water Survey",
  description: "Magnetic dowsing, electrical resistivity and AiGWD methods for groundwater identification.",
  image: "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcRqH0zeBeWlwsqoISWfWz0JMqGVkv4sH8CTALDIBEelPTncSAGd"
}];
const extraServices = [{
  title: "Rain Water Harvesting",
  description: "Intelligent rainwater harvesting systems for groundwater stabilization.",
  image: "https://media.istockphoto.com/id/1298320859/vector/rainwater-harvesting-as-water-resource-accumulation-for-home-outline-concept.jpg?s=2048x2048&w=is&k=20&c=kGLSnYfnl9uF_J6Q0bSj7R6L0UtO8bXvpFRLJjP5VUw="
}, {
  title: "GPR & Thermal Imaging Scanning",
  description: "Ground-penetrating radar and thermal imaging for leak and utility detection.",
  image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbRikzLYAOTLC7tdXdK9at7Yg7KL76oqcHxEocIHTwn1TGiyX1"
}, {
  title: "Watershed Management Services",
  description: "Contour-based design, aquifer mapping and runoff management for long-term results.",
  image: "https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcRYb5SLj4CZHdxhUKsHaPXVci7uJtVwygbTtoetn5hcUMeo5OPe"
}, {
  title: "EC & Green Building Consulting",
  description: "Guidance on environmental clearances and green building practices for commercial and domestic projects.",
  image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIWi13me1bwqzxk6vcnIZjacoEO-rBvwvj32-CuXic5Z-7kc3o"
}, {
  title: "STP & ETP Solutions",
  description: "Wastewater treatment plant design and plant manufacturing (STP/ETP).",
  image: "https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcSn8RJ5Ul-Z3d5Cfqdm7kWv-t2yTuI3RGbW3iNltqmkmsxFKgBC"
}, {
  title: "Water Treatment Plant Manufacturing",
  description: "Manufacture and supply of mineral & alkaline water treatment plants.",
  image: "https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcRh_t__MqG9uVe14SI5fYhyFXojvXIGs5VGo8XPT_7viEZ8MwE0"
}, {
  title: "Energy Saving Solutions",
  description: "Energy-saving schemes and motor/pump replacements to reduce power bills.",
  image: "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcQdPASNRo3jwdZTTh2qhpVtATAMdTKxVWydSGg-oMqqVXYmOmzp"
}, {
  title: "CGWB Registration Services",
  description: "Consultancy for CGWB (Central Ground Water Board) registration and compliance.",
  image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuw4dBkm_1TOjwUN-myEavY3JLzoAfXR5ccBi4nrKEU37LrVfp"
}, {
  title: "Bathymetry / SONAR",
  description: "Bathymetric surveys for lakes, ponds and coastal regions — mapping silt, tides and water properties.",
  image: "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcSXnDtPubGoyASCpsFbd9tc1JrEs12XzkViNOLczyyNhXqmK-jP"
}];
const Services = () => {
  const [showMore, setShowMore] = useState(false);
  return <section id="services" className="pt-20 md:pt-28 pb-12 md:pb-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} transition={{
        duration: 0.6
      }} className="text-center mb-12">
          <h2 className="section-heading mb-4">Our Services</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Comprehensive water management and environmental consulting solutions 
            backed by 35 years of expertise.
          </p>
        </motion.div>

        {/* Main Services Grid */}
        <div className="flex flex-wrap gap-4 justify-center items-start [&>*]:w-[calc(50%-0.5rem)] [&>*]:md:w-[calc(33.333%-0.75rem)] [&>*]:lg:w-[calc(16.666%-0.85rem)]">
          {mainServices.map((service, index) => <ServiceCard key={service.title} {...service} delay={index * 0.1} />)}
        </div>

        {/* Extra Services */}
        <AnimatePresence>
          {showMore && <motion.div initial={{
          opacity: 0,
          height: 0
        }} animate={{
          opacity: 1,
          height: "auto"
        }} exit={{
          opacity: 0,
          height: 0
        }} transition={{
          duration: 0.4
        }} className="overflow-hidden">
              <div className="flex flex-wrap justify-center gap-4 [&>*]:w-[calc(50%-0.5rem)] [&>*]:md:w-[calc(33.333%-0.75rem)] [&>*]:lg:w-[calc(16.666%-0.85rem)]">
                {extraServices.map((service, index) => <ServiceCard key={service.title} {...service} delay={index * 0.05} />)}
              </div>
            </motion.div>}
        </AnimatePresence>

        {/* Toggle Button */}
        <div className="text-center mt-6">
          <button onClick={() => setShowMore(!showMore)} className="inline-flex items-center gap-2 text-primary font-medium hover:text-secondary transition-colors">
            {showMore ? <>
                Show Less <ChevronUp className="w-5 h-5" />
              </> : <>
                Show More Services <ChevronDown className="w-5 h-5" />
              </>}
          </button>
        </div>
      </div>
    </section>;
};
export default Services;