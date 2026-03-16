import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="px-5 py-12 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <img src="/logo-lyss.png" alt="Lyss" className="h-8 object-contain mb-3" />
            <p className="text-xs text-muted-foreground">
              Adjointe administrative IA pour PME québécoises.
            </p>
          </div>

          {/* Produit */}
          <div>
            <h4 className="font-display font-semibold text-sm mb-3">Produit</h4>
            <ul className="space-y-2">
              <li>
                <a href="/#how-it-works" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Comment ça marche
                </a>
              </li>
              <li>
                <a href="/#integrations" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Intégrations
                </a>
              </li>
              <li>
                <a href="/#pricing" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Tarifs
                </a>
              </li>
              <li>
                <button onClick={() => navigate("/tarifs")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Plans détaillés
                </button>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-display font-semibold text-sm mb-3">Support</h4>
            <ul className="space-y-2">
              <li>
                <a href="/#faq" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="mailto:support@lyss.ca" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Nous contacter
                </a>
              </li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h4 className="font-display font-semibold text-sm mb-3">Légal</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => navigate("/politique-confidentialite")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Politique de confidentialité
                </button>
              </li>
              <li>
                <button onClick={() => navigate("/conditions-utilisation")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Conditions d'utilisation
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Lyss · Québec, Canada
          </p>
          <p className="text-xs text-muted-foreground">
            Service de gestion administrative automatisée pour PME.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
