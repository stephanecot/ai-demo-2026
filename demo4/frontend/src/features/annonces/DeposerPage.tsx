import { useState } from 'react'
import { type Annonce, CATEGORY_LABELS } from '../../api/annonces'
import { Button, Card } from '../../shared/ui'
import { AnnonceForm } from './AnnonceForm'
import styles from './DeposerPage.module.css'
import { formatPrice } from './formatPrice'

export function DeposerPage() {
  const [created, setCreated] = useState<Annonce | null>(null)

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Déposer une annonce</h1>
      {created ? (
        <Card className={styles.success} aria-live="polite">
          <h2 className={styles.successTitle}>Votre annonce est en ligne</h2>
          <dl className={styles.summary}>
            <dt>Titre</dt>
            <dd>{created.title}</dd>
            <dt>Prix</dt>
            <dd className={styles.price}>{formatPrice(created.price)}</dd>
            <dt>Catégorie</dt>
            <dd>{CATEGORY_LABELS[created.category]}</dd>
            <dt>Localisation</dt>
            <dd>
              {created.city} ({created.postalCode})
            </dd>
          </dl>
          <div>
            <Button variant="secondary" onClick={() => setCreated(null)}>
              Déposer une autre annonce
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <p className={styles.intro}>Décrivez votre bien en quelques lignes : c'est gratuit et rapide.</p>
          <Card>
            <AnnonceForm onCreated={setCreated} />
          </Card>
        </>
      )}
    </div>
  )
}
